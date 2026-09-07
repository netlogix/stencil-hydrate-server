/**
 * Configuration for the hydrate server.
 *
 * Every option can be set programmatically, via an environment variable or left at its default,
 * in that order of precedence. The generated `index.js` of the output target calls `createServer`
 * without options, so in a container deployment the environment variables are the way in.
 */
export interface ServerOptions {
    /** Maximum number of `renderToString` calls running at the same time. */
    maxConcurrency?: number;
    /** Maximum number of requests allowed to wait for a render slot. */
    maxQueue?: number;
    /** Milliseconds a request may wait for a render slot before it is answered with 503. */
    queueWaitTimeout?: number;
    /** Milliseconds a single render may take, passed to Stencil as `timeout`. */
    hydrateTimeout?: number;
    /** Milliseconds for `server.requestTimeout`. Acts as a last-resort backstop. */
    requestTimeout?: number;
    /** Milliseconds for `server.headersTimeout`. */
    headersTimeout?: number;
    /** Maximum accepted request body size in bytes. Larger bodies are answered with 413. */
    maxBodySize?: number;
}
export type ResolvedServerOptions = Required<ServerOptions>;
export declare const DEFAULT_SERVER_OPTIONS: ResolvedServerOptions;
export declare const ENV_VARIABLE_NAMES: Record<keyof ServerOptions, string>;
export interface OptionResolution {
    options: ResolvedServerOptions;
    warnings: string[];
}
/**
 * Resolves the effective configuration and collects human readable warnings.
 *
 * Warnings are returned rather than logged so that this module stays free of side effects and
 * the caller can route them through its own logging.
 */
export declare const resolveServerOptions: (options?: ServerOptions, env?: Record<string, string | undefined>) => OptionResolution;
/**
 * Checks the invariants that keep renders from outliving the request that asked for them.
 *
 * A render whose caller has already given up still runs to completion, then hits Stencil's
 * `timeout` handling, which calls `win.close()` while component promises may still be pending.
 * The window is reset underneath them (`resetWindow` sets `win.fetch = null` among other things),
 * so unrelated components start failing and the retained object graph is never released. Keeping
 * the queue wait plus the render budget below the request timeout avoids reaching that state.
 */
export declare const validateServerOptions: (options: ResolvedServerOptions) => string[];
