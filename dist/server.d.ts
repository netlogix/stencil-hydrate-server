import * as http from 'http';
import type { HydrateResults, SerializeDocumentOptions } from '@stencil/core/internal';
export declare const createServer: (renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>) => http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
