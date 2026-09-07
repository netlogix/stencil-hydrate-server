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
  /** Milliseconds for `server.requestTimeout`. Acts as a last-resort backstop. */
  requestTimeout?: number
  /** Milliseconds for `server.headersTimeout`. */
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
 * Checks the invariants that keep renders from outliving the request that asked for them.
 *
 * A render whose caller has already given up still runs to completion, then hits Stencil's
 * `timeout` handling, which calls `win.close()` while component promises may still be pending.
 * The window is reset underneath them (`resetWindow` sets `win.fetch = null` among other things),
 * so unrelated components start failing and the retained object graph is never released. Keeping
 * the queue wait plus the render budget below the request timeout avoids reaching that state.
 */
export const validateServerOptions = (options: ResolvedServerOptions): string[] => {
  const warnings: string[] = []
  const budget = options.queueWaitTimeout + options.hydrateTimeout

  if (options.requestTimeout > 0 && budget >= options.requestTimeout) {
    warnings.push(
      `queueWaitTimeout (${options.queueWaitTimeout}ms) + hydrateTimeout (${options.hydrateTimeout}ms) ` +
        `>= requestTimeout (${options.requestTimeout}ms): renders can outlive their request. ` +
        `Lower ${ENV_VARIABLE_NAMES.queueWaitTimeout} or ${ENV_VARIABLE_NAMES.hydrateTimeout}, ` +
        `or raise ${ENV_VARIABLE_NAMES.requestTimeout}.`
    )
  }

  return warnings
}
