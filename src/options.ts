/**
 * Configuration for the hydrate server.
 *
 * Every option can be set programmatically, via an environment variable or left at its default,
 * in that order of precedence. The generated `index.js` of the output target calls `createServer`
 * without options, so in a container deployment the environment variables are the way in.
 */
export interface ServerOptions {
  /** Maximum number of `renderToString` calls running at the same time. */
  maxConcurrency?: number
  /** Maximum number of requests allowed to wait for a render slot. */
  maxQueue?: number
  /** Milliseconds a request may wait for a render slot before it is answered with 503. */
  queueWaitTimeout?: number
  /** Milliseconds a single render may take, passed to Stencil as `timeout`. */
  hydrateTimeout?: number
  /**
   * Milliseconds for `server.requestTimeout`: how long a client may take to send the complete
   * request. Protects against slow or stalled uploads. It does not limit how long a render takes.
   */
  requestTimeout?: number
  /** Milliseconds for `server.headersTimeout`: how long a client may take to send the headers. */
  headersTimeout?: number
  /** Maximum accepted request body size in bytes. Larger bodies are answered with 413. */
  maxBodySize?: number
}

export type ResolvedServerOptions = Required<ServerOptions>

export const DEFAULT_SERVER_OPTIONS: ResolvedServerOptions = {
  maxConcurrency: 1,
  maxQueue: 32,
  queueWaitTimeout: 2000,
  hydrateTimeout: 5000,
  requestTimeout: 10000,
  headersTimeout: 5000,
  maxBodySize: 2 * 1024 * 1024
}

export const ENV_VARIABLE_NAMES: Record<keyof ServerOptions, string> = {
  maxConcurrency: 'HYDRATE_CONCURRENCY',
  maxQueue: 'HYDRATE_MAX_QUEUE',
  queueWaitTimeout: 'HYDRATE_QUEUE_WAIT_TIMEOUT',
  hydrateTimeout: 'HYDRATE_TIMEOUT',
  requestTimeout: 'HYDRATE_REQUEST_TIMEOUT',
  headersTimeout: 'HYDRATE_HEADERS_TIMEOUT',
  maxBodySize: 'HYDRATE_MAX_BODY_SIZE'
}

const MINIMUM_VALUES: Record<keyof ServerOptions, number> = {
  maxConcurrency: 1,
  maxQueue: 0,
  queueWaitTimeout: 0,
  hydrateTimeout: 1,
  requestTimeout: 0,
  headersTimeout: 0,
  maxBodySize: 1
}

const OPTION_NAMES = Object.keys(DEFAULT_SERVER_OPTIONS) as Array<keyof ServerOptions>

export interface OptionResolution {
  options: ResolvedServerOptions
  warnings: string[]
}

const isUsable = (value: unknown, minimum: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= minimum

/**
 * Resolves the effective configuration and collects human readable warnings.
 *
 * Warnings are returned rather than logged so that this module stays free of side effects and
 * the caller can route them through its own logging.
 */
export const resolveServerOptions = (
  options: ServerOptions = {},
  env: Record<string, string | undefined> = process.env
): OptionResolution => {
  const warnings: string[] = []
  const resolved = {...DEFAULT_SERVER_OPTIONS}

  for (const name of OPTION_NAMES) {
    const minimum = MINIMUM_VALUES[name]
    const envName = ENV_VARIABLE_NAMES[name]
    const given = options[name]

    if (given !== undefined) {
      if (isUsable(given, minimum)) {
        resolved[name] = given
        continue
      }
      warnings.push(
        `option "${name}" must be an integer >= ${minimum}, got ${JSON.stringify(given)}; using ${resolved[name]}`
      )
      continue
    }

    const fromEnv = env[envName]

    if (fromEnv === undefined || fromEnv.trim() === '') {
      continue
    }

    const parsed = Number(fromEnv)

    if (isUsable(parsed, minimum)) {
      resolved[name] = parsed
      continue
    }

    warnings.push(
      `${envName} must be an integer >= ${minimum}, got ${JSON.stringify(fromEnv)}; using ${resolved[name]}`
    )
  }

  warnings.push(...validateServerOptions(resolved))

  return {options: resolved, warnings}
}

/**
 * Checks that the options are consistent with each other and corrects them where they are not.
 *
 * Node only enforces `headersTimeout <= requestTimeout` when both are passed to the `http.Server`
 * constructor, not when they are assigned afterwards as done here. A larger `headersTimeout` would
 * silently have no effect, so it is clamped to `requestTimeout` instead.
 */
export const validateServerOptions = (options: ResolvedServerOptions): string[] => {
  const warnings: string[] = []

  if (options.requestTimeout > 0 && options.headersTimeout > options.requestTimeout) {
    warnings.push(
      `headersTimeout (${options.headersTimeout}ms) must not exceed requestTimeout (${options.requestTimeout}ms); ` +
        `using ${options.requestTimeout}ms. Lower ${ENV_VARIABLE_NAMES.headersTimeout} ` +
        `or raise ${ENV_VARIABLE_NAMES.requestTimeout}.`
    )
    options.headersTimeout = options.requestTimeout
  }

  return warnings
}
