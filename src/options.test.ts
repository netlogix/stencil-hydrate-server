import {describe, it, expect} from 'vitest'
import {DEFAULT_SERVER_OPTIONS, ENV_VARIABLE_NAMES, resolveServerOptions, validateServerOptions} from './options'

describe('resolveServerOptions', () => {
  it('falls back to the defaults when nothing is configured', () => {
    const {options, warnings} = resolveServerOptions({}, {})

    expect(options).toEqual(DEFAULT_SERVER_OPTIONS)
    expect(warnings).toEqual([])
  })

  it('serialises renders by default so that peak memory stays independent of incoming load', () => {
    const {options} = resolveServerOptions({}, {})

    expect(options.maxConcurrency).toBe(1)
  })

  it('reads values from the environment', () => {
    const {options, warnings} = resolveServerOptions(
      {},
      {
        [ENV_VARIABLE_NAMES.maxConcurrency]: '4',
        [ENV_VARIABLE_NAMES.maxQueue]: '8',
        [ENV_VARIABLE_NAMES.queueWaitTimeout]: '1500',
        [ENV_VARIABLE_NAMES.hydrateTimeout]: '3000',
        [ENV_VARIABLE_NAMES.requestTimeout]: '7000',
        [ENV_VARIABLE_NAMES.headersTimeout]: '4000',
        [ENV_VARIABLE_NAMES.maxBodySize]: '1024'
      }
    )

    expect(options).toEqual({
      maxConcurrency: 4,
      maxQueue: 8,
      queueWaitTimeout: 1500,
      hydrateTimeout: 3000,
      requestTimeout: 7000,
      headersTimeout: 4000,
      maxBodySize: 1024
    })
    expect(warnings).toEqual([])
  })

  it('lets explicit options win over the environment', () => {
    const {options} = resolveServerOptions({maxConcurrency: 2}, {[ENV_VARIABLE_NAMES.maxConcurrency]: '9'})

    expect(options.maxConcurrency).toBe(2)
  })

  it('ignores empty environment variables', () => {
    const {options, warnings} = resolveServerOptions({}, {[ENV_VARIABLE_NAMES.maxConcurrency]: '   '})

    expect(options.maxConcurrency).toBe(DEFAULT_SERVER_OPTIONS.maxConcurrency)
    expect(warnings).toEqual([])
  })

  it('warns and keeps the default for an unparsable environment variable', () => {
    const {options, warnings} = resolveServerOptions({}, {[ENV_VARIABLE_NAMES.maxQueue]: 'lots'})

    expect(options.maxQueue).toBe(DEFAULT_SERVER_OPTIONS.maxQueue)
    expect(warnings).toEqual([expect.stringContaining(ENV_VARIABLE_NAMES.maxQueue)])
  })

  it('warns and keeps the default for a value below the allowed minimum', () => {
    const {options, warnings} = resolveServerOptions({maxConcurrency: 0}, {})

    expect(options.maxConcurrency).toBe(DEFAULT_SERVER_OPTIONS.maxConcurrency)
    expect(warnings).toEqual([expect.stringContaining('maxConcurrency')])
  })

  it('warns and keeps the default for a non integer value', () => {
    const {options, warnings} = resolveServerOptions({}, {[ENV_VARIABLE_NAMES.hydrateTimeout]: '1500.5'})

    expect(options.hydrateTimeout).toBe(DEFAULT_SERVER_OPTIONS.hydrateTimeout)
    expect(warnings).toEqual([expect.stringContaining(ENV_VARIABLE_NAMES.hydrateTimeout)])
  })

  it('accepts a zero length queue, which turns every wait into an immediate rejection', () => {
    const {options, warnings} = resolveServerOptions({maxQueue: 0}, {})

    expect(options.maxQueue).toBe(0)
    expect(warnings).toEqual([])
  })
})

describe('validateServerOptions', () => {
  it('holds for the shipped defaults', () => {
    expect(validateServerOptions({...DEFAULT_SERVER_OPTIONS})).toEqual([])
  })

  it('accepts a headers timeout equal to the request timeout', () => {
    expect(validateServerOptions({...DEFAULT_SERVER_OPTIONS, headersTimeout: 7000, requestTimeout: 7000})).toEqual([])
  })

  it('warns and clamps a headers timeout that exceeds the request timeout', () => {
    const options = {...DEFAULT_SERVER_OPTIONS, headersTimeout: 8000, requestTimeout: 6000}
    const warnings = validateServerOptions(options)

    expect(warnings).toEqual([expect.stringContaining(ENV_VARIABLE_NAMES.headersTimeout)])
    expect(options.headersTimeout).toBe(6000)
  })

  it('skips the check when the request timeout is disabled', () => {
    const options = {...DEFAULT_SERVER_OPTIONS, headersTimeout: 8000, requestTimeout: 0}

    expect(validateServerOptions(options)).toEqual([])
    expect(options.headersTimeout).toBe(8000)
  })
})

describe('DEFAULT_SERVER_OPTIONS', () => {
  it('fits queue wait plus render budget into a 5 second caller timeout with headroom', () => {
    expect(DEFAULT_SERVER_OPTIONS.queueWaitTimeout + DEFAULT_SERVER_OPTIONS.hydrateTimeout).toBeLessThan(5000)
  })
})
