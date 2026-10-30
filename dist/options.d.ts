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
    /**
     * Milliseconds for `server.requestTimeout`: how long a client may take to send the complete
     * request. Protects against slow or stalled uploads. It does not limit how long a render takes.
     */
    requestTimeout?: number;
    /** Milliseconds for `server.headersTimeout`: how long a client may take to send the headers. */
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
 * Checks that the options are consistent with each other and corrects them where they are not.
 *
 * Node only enforces `headersTimeout <= requestTimeout` when both are passed to the `http.Server`
 * constructor, not when they are assigned afterwards as done here. A larger `headersTimeout` would
 * silently have no effect, so it is clamped to `requestTimeout` instead.
 */
export declare const validateServerOptions: (options: ResolvedServerOptions) => string[];
