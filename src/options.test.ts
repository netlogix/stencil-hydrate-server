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
  it('accepts a budget that fits inside the request timeout', () => {
    expect(
      validateServerOptions({
        ...DEFAULT_SERVER_OPTIONS,
        queueWaitTimeout: 1500,
        hydrateTimeout: 3000,
        requestTimeout: 7000
      })
    ).toEqual([])
  })

  it('warns when queue wait plus render budget can outlive the request', () => {
    const warnings = validateServerOptions({
      ...DEFAULT_SERVER_OPTIONS,
      queueWaitTimeout: 5000,
      hydrateTimeout: 15000,
      requestTimeout: 10000
    })

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('outlive')
  })

  it('warns on the boundary case where the budget exactly matches the request timeout', () => {
    const warnings = validateServerOptions({
      ...DEFAULT_SERVER_OPTIONS,
      queueWaitTimeout: 2000,
      hydrateTimeout: 5000,
      requestTimeout: 7000
    })

    expect(warnings).toHaveLength(1)
  })

  it('skips the check when the request timeout is disabled', () => {
    expect(
      validateServerOptions({
        ...DEFAULT_SERVER_OPTIONS,
        queueWaitTimeout: 5000,
        hydrateTimeout: 15000,
        requestTimeout: 0
      })
    ).toEqual([])
  })

  it('holds for the shipped defaults', () => {
    expect(validateServerOptions(DEFAULT_SERVER_OPTIONS)).toEqual([])
  })
})
