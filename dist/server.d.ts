import * as http from 'http';
import type { HydrateResults, SerializeDocumentOptions } from '@stencil/core/internal';
export interface ServerErrorContext {
    /** `exception`: the request handler threw, `hydration`: renderToString reported a non-200 httpStatus */
    kind: 'exception' | 'hydration';
    /** URL of the page being rendered (from the request payload), not the URL of the hydrate server */
    url?: string;
    /** Trace id of the incoming W3C `traceparent` header, or of the `X-Tracing-ID` header if there is no valid one */
    traceId?: string;
    buildId?: string;
    diagnostics?: HydrateResults['diagnostics'];
    /** Size and SHA-256 of the HTML to hydrate, so identical inputs can be recognised without exposing the HTML */
    bodyLength?: number;
    bodyHash?: string;
}
export interface ServerOptions {
    /**
     * Called after the error response was sent. Must not rely on the response, and a throwing hook never
     * affects it: errors thrown by the hook are logged and swallowed.
     */
    onError?: (error: Error, context: ServerErrorContext) => void;
}
export declare const createServer: (renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>, options?: ServerOptions) => http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
