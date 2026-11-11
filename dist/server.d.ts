import * as http from 'http';
import type { HydrateResults, SerializeDocumentOptions } from '@stencil/core/internal';
import { type ServerOptions } from './options';
export type { ServerOptions } from './options';
export declare const createServer: (renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>, serverOptions?: ServerOptions) => http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
