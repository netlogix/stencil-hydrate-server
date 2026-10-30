# @netlogix/stencil-hydrate-server

A Stencil output target to generate server for hydrating components.

## Usage

To use this output target, add it to your `stencil.config.ts`:

```typescript
import { Config } from '@stencil/core';
import { hydrateServerOutputTarget } from '@netlogix/stencil-hydrate-server';

export const config: Config = {
  // ...  
  outputTargets: [
    // ... other output targets
    {
      type: 'dist-hydrate-script',
      dir: 'dist/hydrate',
    },  
    hydrateServerOutputTarget({
      dir: 'dist/hydrate-server',
    }),
  ],
  // ...  
};
```

This will generate server code for hydrating your Stencil components. You can then use the generated code to render your components on the server and send the HTML to the client for faster page load times.

For more information on how to use Stencil output targets, please refer to the [Stencil documentation](https://stenciljs.com/docs/output-targets).

## Error hook

To forward failed renders to an error tracker, point the output target at a hooks module:

```typescript
hydrateServerOutputTarget({
  dir: 'dist/hydrate-server',
  hooksModule: './ssr/hooks.js' // resolved relative to the Stencil root dir
})
```

The module is required by the generated server (and bundled with it, so it can import its own dependencies) and may export `onError(error, context)`:

```javascript
exports.onError = (error, context) => {
  // context.kind: 'exception' (handler threw) | 'hydration' (renderToString returned a non-200 httpStatus)
  // context.url, context.traceId (X-Tracing-ID header, else the trace id of the traceparent header), context.buildId, context.diagnostics
  // context.bodyLength, context.bodyHash (SHA-256 of the HTML to hydrate, the HTML itself is never passed)
}
```

The hook runs after the error response was sent and may be async, the server does not wait for it. If it throws or rejects, the error is logged and the response stays untouched. The hash and length of the body are only computed when a hook is configured.

## License
This package is licensed under the MIT license.