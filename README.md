# @netlogix/stencil-hydrate-server

A Stencil output target to generate server for hydrating components.

## Usage

To use this output target, add it to your `stencil.config.ts`:

```typescript
import {Config} from '@stencil/core'
import {hydrateServerOutputTarget} from '@netlogix/stencil-hydrate-server'

export const config: Config = {
  // ...
  outputTargets: [
    // ... other output targets
    {
      type: 'dist-hydrate-script',
      dir: 'dist/hydrate'
    },
    hydrateServerOutputTarget({
      dir: 'dist/hydrate-server'
    })
  ]
  // ...
}
```

This will generate server code for hydrating your Stencil components. You can then use the generated code to render your components on the server and send the HTML to the client for faster page load times.

For more information on how to use Stencil output targets, please refer to the [Stencil documentation](https://stenciljs.com/docs/output-targets).

## Render concurrency

Since version 1.6.0 the generated server renders **one page at a time by default** and queues the
rest. Previously it started a render for every incoming request immediately.

The reason is how Stencil's hydrate app works: `renderToString` re-evaluates the entire hydrate
bundle on every call, so each concurrent render holds a full copy of your app plus its parsed
document. Rendering itself is single threaded, so running renders in parallel does not make the
CPU bound part any faster — it only multiplies peak memory. Roughly:

```
peak memory ~= baseline + concurrent renders x bundle copy
```

For a mid-sized shop frontend a bundle copy is easily 100 MB or more, which is why 30 parallel
requests could take a container from a few hundred megabytes to several gigabytes and end in
`JavaScript heap out of memory`.

Once memory is tight, a second effect takes over: renders slow down, overrun Stencil's `timeout`,
and `finalizeHydrate` closes their window while component promises are still pending. Stencil's
`resetWindow` sets `win.fetch = null` among other things, so components that resume afterwards see
a `globalThis` that has been torn out from under them and unrelated components start throwing. The
timeout defaults below are chosen so that this state is not reachable.

### If you see 503 responses after upgrading

That is the load shedding working as intended: a request that cannot get a render slot within
`HYDRATE_QUEUE_WAIT_TIMEOUT` is answered with `503` and `Retry-After: 1` instead of being left to
time out on the caller. Make sure your caller falls back to the un-hydrated HTML in that case —
the client side runtime will hydrate it anyway, so the page is slower but intact.

If 503s are too frequent, raise `HYDRATE_CONCURRENCY`. Renders that wait on backend requests leave
the CPU idle, so a value of 2 to 4 often buys throughput at a predictable memory cost. Measure it:

```bash
node scripts/loadtest.mjs --url http://localhost:8080 --requests 300 --sequential
node scripts/loadtest.mjs --url http://localhost:8080 --requests 300 --concurrency 30
```

## Configuration

Every setting can be passed to `createServer` or set as an environment variable, in that order of
precedence. The generated `index.js` calls `createServer` without arguments, so in a container
deployment the environment variables are the way in.

| Option             | Environment variable         | Default   | Meaning                                                     |
| ------------------ | ---------------------------- | --------- | ----------------------------------------------------------- |
| `maxConcurrency`   | `HYDRATE_CONCURRENCY`        | `1`       | Renders allowed to run at the same time                     |
| `maxQueue`         | `HYDRATE_MAX_QUEUE`          | `32`      | Requests allowed to wait for a slot, then `503`             |
| `queueWaitTimeout` | `HYDRATE_QUEUE_WAIT_TIMEOUT` | `2000`    | Milliseconds a request may wait for a slot, then `503`      |
| `hydrateTimeout`   | `HYDRATE_TIMEOUT`            | `5000`    | Milliseconds a single render may take (Stencil's `timeout`) |
| `requestTimeout`   | `HYDRATE_REQUEST_TIMEOUT`    | `10000`   | `server.requestTimeout`, a last resort backstop             |
| `headersTimeout`   | `HYDRATE_HEADERS_TIMEOUT`    | `5000`    | `server.headersTimeout`                                     |
| `maxBodySize`      | `HYDRATE_MAX_BODY_SIZE`      | `2097152` | Largest accepted request body in bytes, then `413`          |

### Picking the timeouts

Derive them from the timeout your caller uses, so that a render can never outlive the request that
asked for it. Starting from a caller timeout of `T`:

- `HYDRATE_QUEUE_WAIT_TIMEOUT` about `T / 3`, leaving two thirds of the budget for rendering
- `HYDRATE_TIMEOUT` about `T` minus the queue wait, minus a small margin
- `HYDRATE_REQUEST_TIMEOUT` slightly above `T`

For a caller with a 5 second timeout:

```
HYDRATE_QUEUE_WAIT_TIMEOUT=1500
HYDRATE_TIMEOUT=3000
HYDRATE_REQUEST_TIMEOUT=7000
```

The server logs a warning at startup if `queueWaitTimeout + hydrateTimeout >= requestTimeout`,
because that is exactly the configuration in which renders outlive their request.

## Endpoints

| Method | Path       | Purpose                         |
| ------ | ---------- | ------------------------------- |
| `POST` | `/`        | Hydrate the posted document     |
| `GET`  | `/healthz` | Liveness probe, always `200 ok` |
| `GET`  | `/metrics` | Prometheus metrics              |

`/healthz` and `/metrics` never enter the render queue, so they stay responsive while the server is
saturated. `/healthz` deliberately does not reflect saturation — a liveness probe that fails under
load would get the container restarted in the middle of a traffic spike.

## Metrics

`GET /metrics` serves the Prometheus text exposition format, with no additional dependencies.

| Metric                                    | Type      |
| ----------------------------------------- | --------- |
| `hydrate_renders_active`                  | gauge     |
| `hydrate_queue_depth`                     | gauge     |
| `hydrate_renders_total{result}`           | counter   |
| `hydrate_requests_rejected_total{reason}` | counter   |
| `hydrate_render_duration_seconds`         | histogram |
| `hydrate_queue_wait_seconds`              | histogram |
| `nodejs_heap_size_used_bytes`             | gauge     |
| `nodejs_heap_size_total_bytes`            | gauge     |
| `nodejs_gc_duration_seconds`              | histogram |

`result` is one of `ok`, `hydration_error`, `error`. `reason` is one of `queue_full`,
`queue_timeout`, `body_too_large`, `client_disconnected`. The request URL is deliberately not a
label — it would create one time series per page.

Example scrape configuration:

```yaml
scrape_configs:
  - job_name: hydrate-server
    scrape_interval: 15s
    static_configs:
      - targets: ['hydrate-server:8080']
```

`nodejs_gc_duration_seconds` is the metric to alert on. When retained memory approaches the heap
limit, major collections start dominating the single thread long before the process actually runs
out of memory, so rising GC pause time is the earliest warning available:

```
rate(nodejs_gc_duration_seconds_sum[1m]) > 0.2
```

## License

This package is licensed under the MIT license.
