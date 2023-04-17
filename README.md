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

## License
This package is licensed under the MIT license.