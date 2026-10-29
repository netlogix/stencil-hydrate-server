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

## Upgrading to 2.0.0

Version 2.0.0 changes how the generated server behaves under load. No code changes are required,
but responses other than `200` become more frequent:

| Status | When                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| `503`  | No render slot became free within `HYDRATE_QUEUE_WAIT_TIMEOUT`, or the queue is full   |
| `413`  | The request body is larger than `HYDRATE_MAX_BODY_SIZE` (default 2 MiB)                |
| `400`  | The request body is not JSON with a string `body` (previously `500`)                   |
| `500`  | The render exceeded `HYDRATE_TIMEOUT`, now 3.5 seconds instead of Stencil's 15 seconds |

If your caller already falls back to the un-hydrated HTML on any status other than `200`, nothing
needs to change. The page is then rendered on the client only, slower but intact. Otherwise, add
that fallback before upgrading.

Check two settings for your deployment:

- `HYDRATE_CONCURRENCY` against the container's memory limit, see
  [Deployment recommendations](#deployment-recommendations).
- `HYDRATE_QUEUE_WAIT_TIMEOUT` plus `HYDRATE_TIMEOUT` against your caller's timeout, see
  [Picking the timeouts](#picking-the-timeouts).

## Render concurrency

Since version 2.0.0 the generated server renders **one page at a time by default** and queues the
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
a `globalThis` that has been torn out from under them and unrelated components start throwing.
Limiting concurrency keeps renders fast enough that this state becomes rare, but it cannot rule it
out, see [Known limitation](#known-limitation-renders-that-exceed-the-timeout).

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
| `queueWaitTimeout` | `HYDRATE_QUEUE_WAIT_TIMEOUT` | `1000`    | Milliseconds a request may wait for a slot, then `503`      |
| `hydrateTimeout`   | `HYDRATE_TIMEOUT`            | `3500`    | Milliseconds a single render may take (Stencil's `timeout`) |
| `requestTimeout`   | `HYDRATE_REQUEST_TIMEOUT`    | `10000`   | Milliseconds a client may take to send the whole request    |
| `headersTimeout`   | `HYDRATE_HEADERS_TIMEOUT`    | `5000`    | Milliseconds a client may take to send the headers          |
| `maxBodySize`      | `HYDRATE_MAX_BODY_SIZE`      | `2097152` | Largest accepted request body in bytes, then `413`          |

### Picking the timeouts

The server cannot know how long its caller waits. A render that is still running when the caller
gives up renders for nobody, and with a single render slot every request behind it waits as well.
So keep the queue wait plus the render budget below your caller's timeout:

```
HYDRATE_QUEUE_WAIT_TIMEOUT + HYDRATE_TIMEOUT < caller timeout
```

The defaults of 1000 + 3500 ms fit a caller timeout of 5 seconds with 500 ms left for the network
and for serialising the response. For a caller with a 10 second timeout, for example:

```
HYDRATE_QUEUE_WAIT_TIMEOUT=2000
HYDRATE_TIMEOUT=7500
```

`HYDRATE_REQUEST_TIMEOUT` and `HYDRATE_HEADERS_TIMEOUT` are unrelated to this. They map to Node's
`server.requestTimeout` and `server.headersTimeout`, which only limit how long a client may take to
_send_ the request and protect against slow or stalled uploads. They do not limit how long a render
takes. `HYDRATE_HEADERS_TIMEOUT` must not exceed `HYDRATE_REQUEST_TIMEOUT`; a larger value is
lowered to it with a warning at startup.

## Deployment recommendations

- **Memory limit and concurrency.** Measure the baseline and the memory per concurrent render
  with `scripts/loadtest.mjs`, then pick `HYDRATE_CONCURRENCY` so that
  `baseline + HYDRATE_CONCURRENCY x memory per render` stays clearly below the container's memory
  limit. With a baseline of about 280 MB and 130 MB per render, a 500 MB container fits exactly one
  render at a time.
- **Tell V8 about the limit.** Without `--max-old-space-size`, V8 does not know about the container
  limit and collects garbage too late. Set it somewhat below the limit, e.g.
  `NODE_OPTIONS=--max-old-space-size=384` for a 500 MB container. If memory still runs out, the
  process then fails fast and the container's restart policy brings it back, instead of hanging in
  long garbage collection pauses.
- **Healthcheck interval.** Rendering is mostly synchronous and blocks the event loop while it runs,
  so `/healthz` cannot answer during that time. A healthcheck with a short timeout and few retries
  (e.g. every 2 seconds with a 2 second timeout and 3 retries) can mark a busy but healthy
  container as unhealthy. Allow for at least `HYDRATE_TIMEOUT` plus a long garbage collection pause,
  e.g. every 5 seconds with a 3 second timeout and 3 retries.

## Known limitation: renders that exceed the timeout

When a render exceeds `HYDRATE_TIMEOUT`, Stencil closes its window while component promises may
still be pending. `renderToString` returns, the render slot is released and the next render starts,
but the abandoned promises keep their copy of the app in memory until they settle. If a backend
hangs and every render runs into the timeout, memory can still grow — more slowly than before, but
without a bound in this server.

This is a Stencil limitation (see
[stenciljs/core#6865](https://github.com/stenciljs/core/pull/6865)). These renders are counted as
`hydrate_renders_total{result="timeout"}`, so alert on that alongside the garbage collection metric
below:

```
rate(hydrate_renders_total{result="timeout"}[5m]) > 0
```

## Endpoints

| Method | Path       | Purpose                         |
| ------ | ---------- | ------------------------------- |
| `POST` | `/`        | Hydrate the posted document     |
| `GET`  | `/healthz` | Liveness probe, always `200 ok` |
| `GET`  | `/metrics` | Prometheus metrics              |

`/healthz` and `/metrics` never enter the render queue, so they stay responsive while the server is
saturated. `/healthz` deliberately does not reflect saturation — a liveness probe that fails under
load would get the container restarted in the middle of a traffic spike. A running render does block
the event loop, though, see [Deployment recommendations](#deployment-recommendations).

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

`result` is one of `ok`, `hydration_error`, `timeout`, `error`. `reason` is one of `queue_full`,
`queue_timeout`, `body_too_large`, `bad_request`, `client_disconnected`. The request URL is deliberately not a
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
