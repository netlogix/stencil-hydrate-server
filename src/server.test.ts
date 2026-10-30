import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {Server} from 'http'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'
import {createHash} from 'crypto'
import {createServer, type ServerOptions} from './server'

vi.mock('crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('crypto')>()
  return {...actual, createHash: vi.fn(actual.createHash)}
})

const createHashSpy = vi.mocked(createHash)

const buildHydrateResults = (overrides: Partial<HydrateResults> = {}): HydrateResults => ({
  buildId: 'build-1',
  diagnostics: [],
  url: 'http://localhost/',
  host: null,
  hostname: null,
  href: null,
  port: null,
  pathname: null,
  search: null,
  hash: null,
  html: '',
  components: [],
  anchors: [],
  imgs: [],
  scripts: [],
  styles: [],
  staticData: [],
  title: null,
  hydratedCount: 0,
  httpStatus: 200,
  ...overrides
})

type RenderToString = (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>

const startServer = async (renderToString: RenderToString, options?: ServerOptions) => {
  const server = createServer(renderToString, options)
  await new Promise<void>(resolve => server.listen(0, resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('expected server to listen on a port')
  }
  return {server, baseUrl: `http://127.0.0.1:${address.port}`}
}

const stopServer = (server: Server) => new Promise<void>(resolve => server.close(() => resolve()))

describe('createServer', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    createHashSpy.mockClear()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('responds to GET /healthz with 200 ok without touching renderToString', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(`${baseUrl}/healthz`)
      const body = await response.text()

      expect(response.status).toBe(200)
      expect(body).toBe('ok')
      expect(renderToString).not.toHaveBeenCalled()
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 405 for any non-POST request other than GET /healthz', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const [getOther, put] = await Promise.all([fetch(`${baseUrl}/some-path`), fetch(baseUrl, {method: 'PUT'})])

      expect(getOther.status).toBe(405)
      expect(put.status).toBe(405)
      expect(renderToString).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=405'))
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 500 and no body when the request body is not valid JSON', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {method: 'POST', body: 'not-json'})
      const body = await response.text()

      expect(response.status).toBe(500)
      expect(body).toBe('')
      expect(renderToString).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=500'))
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 500 and no body when renderToString reports a non-200 httpStatus', async () => {
    const renderToString = vi.fn().mockResolvedValue(buildHydrateResults({httpStatus: 404, html: '<p>nope</p>'}))
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({body: '<p>hi</p>', url: '/page', labels: {}, settings: {}})
      })
      const body = await response.text()

      expect(response.status).toBe(500)
      expect(body).toBe('')
    } finally {
      await stopServer(server)
    }
  })

  it('passes url, labels and settings through to renderToString and returns a full document as-is', async () => {
    let capturedOptions: SerializeDocumentOptions | undefined
    const inputHtml =
      '<html><head><title>t</title></head><body><esi:include src="/frag" />Hello&nbsp;World</body></html>'

    const renderToString = vi.fn(async (html: string, options?: SerializeDocumentOptions) => {
      capturedOptions = options
      // simulate stencil calling the lifecycle hooks with a fake document
      const attributes: Record<string, string> = {}
      const fakeDocument = {
        body: {
          setAttribute: (name: string, value: string) => {
            attributes[name] = value
          },
          removeAttribute: (name: string) => {
            delete attributes[name]
          }
        }
      }
      options?.beforeHydrate?.(fakeDocument as any)
      expect(attributes['data-nlx-ssr-labels']).toBe(JSON.stringify({greeting: 'hi'}))
      expect(attributes['data-nlx-ssr-settings']).toBe(JSON.stringify({theme: 'dark'}))
      options?.afterHydrate?.(fakeDocument as any)
      expect(attributes['data-nlx-ssr-labels']).toBeUndefined()
      expect(attributes['data-nlx-ssr-settings']).toBeUndefined()

      return buildHydrateResults({html, httpStatus: 200})
    })

    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          body: inputHtml,
          url: '/page',
          labels: {greeting: 'hi'},
          settings: {theme: 'dark'}
        })
      })
      const responseHtml = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/html')
      expect(responseHtml).toBe(inputHtml)

      expect(capturedOptions).toMatchObject({
        prettyHtml: false,
        url: '/page',
        runtimeLogging: true
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('url=/page'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=200'))
    } finally {
      await stopServer(server)
    }
  })

  it('extracts head+body as a fragment when the input is not a full document, and strips the injected meta charset', async () => {
    const renderToString = vi.fn().mockResolvedValue(
      buildHydrateResults({
        html: '<html><head><meta charset="utf-8"><title>t</title></head><body><p>Hi</p></body></html>',
        httpStatus: 200
      })
    )
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({body: '<p>Hi</p>', url: '/page', labels: {}, settings: {}})
      })
      const responseHtml = await response.text()

      expect(response.status).toBe(200)
      expect(responseHtml).not.toContain('<html')
      expect(responseHtml).not.toContain('meta charset')
      expect(responseHtml).toContain('<title>t</title>')
      expect(responseHtml).toContain('<p>Hi</p>')
    } finally {
      await stopServer(server)
    }
  })

  it('keeps the injected meta charset in the fragment when the original input already had one', async () => {
    const renderToString = vi.fn().mockResolvedValue(
      buildHydrateResults({
        html: '<html><head><meta charset="utf-8"><title>t</title></head><body><p>Hi</p></body></html>',
        httpStatus: 200
      })
    )
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          body: '<meta charset="UTF-8"><p>Hi</p>',
          url: '/page',
          labels: {},
          settings: {}
        })
      })
      const responseHtml = await response.text()

      expect(response.status).toBe(200)
      expect(responseHtml).toContain('meta charset="utf-8"')
    } finally {
      await stopServer(server)
    }
  })
  describe('onError hook', () => {
    const post = (baseUrl: string, payload: string, headers: Record<string, string> = {}) =>
      fetch(baseUrl, {method: 'POST', headers, body: payload})

    it('reports exceptions with url, trace id and body fingerprint, after responding with 500', async () => {
      const onError = vi.fn()
      const renderToString = vi.fn().mockRejectedValue(new Error('component exploded'))
      const {server, baseUrl} = await startServer(renderToString, {onError})
      const html = '<p>secret customer data</p>'

      try {
        const response = await post(baseUrl, JSON.stringify({body: html, url: '/page', labels: {}, settings: {}}), {
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
        })

        expect(response.status).toBe(500)
        await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))

        const [error, context] = onError.mock.calls[0]
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('component exploded')
        expect(context).toEqual({
          kind: 'exception',
          url: '/page',
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          bodyLength: html.length,
          bodyHash: 'a3d6228643510560c95eca4d648583d282b1ee58eed14794d82917e6348f4b72'
        })
        expect(JSON.stringify(context)).not.toContain('secret customer data')
      } finally {
        await stopServer(server)
      }
    })

    it('prefers X-Tracing-ID, falls back to traceparent and ignores malformed trace headers', async () => {
      const onError = vi.fn()
      const renderToString = vi.fn().mockRejectedValue(new Error('boom'))
      const {server, baseUrl} = await startServer(renderToString, {onError})
      const payload = JSON.stringify({body: '<p/>', url: '/', labels: {}, settings: {}})

      try {
        await post(baseUrl, payload, {'X-Tracing-ID': '0123456789abcdef0123456789abcdef'})
        await post(baseUrl, payload, {
          'X-Tracing-ID': '0123456789abcdef0123456789abcdef',
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
        })
        await post(baseUrl, payload, {traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'})
        await post(baseUrl, payload, {traceparent: 'garbage', 'X-Tracing-ID': 'not-hex'})
        await post(baseUrl, payload, {'X-Tracing-ID': '0'.repeat(32)})
        await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(5))

        const traceIds = onError.mock.calls.map(call => call[1].traceId)
        expect(traceIds).toEqual([
          '0123456789abcdef0123456789abcdef',
          '0123456789abcdef0123456789abcdef',
          '4bf92f3577b34da6a3ce929d0e0e4736',
          undefined,
          undefined
        ])
      } finally {
        await stopServer(server)
      }
    })

    it('reports a non-200 hydration result with its diagnostics and build id', async () => {
      const onError = vi.fn()
      const diagnostics = [{level: 'error', type: 'hydrate', header: 'Boom', messageText: 'swiper is not defined'}]
      const renderToString = vi
        .fn()
        .mockResolvedValue(buildHydrateResults({httpStatus: 500, diagnostics: diagnostics as any}))
      const {server, baseUrl} = await startServer(renderToString, {onError})

      try {
        const response = await post(
          baseUrl,
          JSON.stringify({body: '<p>hi</p>', url: '/page', labels: {}, settings: {}})
        )

        expect(response.status).toBe(500)
        await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))

        const [error, context] = onError.mock.calls[0]
        expect(error.message).toBe('Hydration error: swiper is not defined')
        expect(context).toMatchObject({kind: 'hydration', url: '/page', buildId: 'build-1', diagnostics})
        expect(context.traceId).toBeUndefined()
      } finally {
        await stopServer(server)
      }
    })

    it('reports invalid JSON bodies without url or body fingerprint', async () => {
      const onError = vi.fn()
      const {server, baseUrl} = await startServer(vi.fn(), {onError})

      try {
        await post(baseUrl, 'not-json')
        await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1))

        const [, context] = onError.mock.calls[0]
        expect(context.kind).toBe('exception')
        expect(context.url).toBeUndefined()
        expect(context.bodyHash).toBeUndefined()
      } finally {
        await stopServer(server)
      }
    })

    it('does not report successful renders', async () => {
      const onError = vi.fn()
      const renderToString = vi
        .fn()
        .mockResolvedValue(buildHydrateResults({html: '<html><head></head><body></body></html>'}))
      const {server, baseUrl} = await startServer(renderToString, {onError})

      try {
        const response = await post(
          baseUrl,
          JSON.stringify({body: '<html><head></head><body></body></html>', url: '/', labels: {}, settings: {}})
        )

        expect(response.status).toBe(200)
        expect(onError).not.toHaveBeenCalled()
      } finally {
        await stopServer(server)
      }
    })

    it('keeps the 500 response and logs when the hook itself throws', async () => {
      const onError = vi.fn(() => {
        throw new Error('sentry down')
      })
      const renderToString = vi.fn().mockRejectedValue(new Error('component exploded'))
      const {server, baseUrl} = await startServer(renderToString, {onError})

      try {
        const response = await post(baseUrl, JSON.stringify({body: '<p/>', url: '/', labels: {}, settings: {}}))

        expect(response.status).toBe(500)
        await vi.waitFor(() =>
          expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('message="onError hook failed"'))
        )
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error="sentry down"'))
      } finally {
        await stopServer(server)
      }
    })

    it('keeps the 500 response and logs when an async hook rejects', async () => {
      const unhandledRejection = vi.fn()
      process.on('unhandledRejection', unhandledRejection)
      const onError = vi.fn(async () => {
        throw new Error('sentry down async')
      })
      const renderToString = vi.fn().mockRejectedValue(new Error('component exploded'))
      const {server, baseUrl} = await startServer(renderToString, {onError})

      try {
        const response = await post(baseUrl, JSON.stringify({body: '<p/>', url: '/', labels: {}, settings: {}}))

        expect(response.status).toBe(500)
        await vi.waitFor(() =>
          expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('error="sentry down async"'))
        )
        expect(unhandledRejection).not.toHaveBeenCalled()
      } finally {
        process.off('unhandledRejection', unhandledRejection)
        await stopServer(server)
      }
    })

    it('does not hash the body when no hook is configured', async () => {
      const renderToString = vi.fn().mockRejectedValue(new Error('component exploded'))
      const {server, baseUrl} = await startServer(renderToString)

      try {
        const response = await post(baseUrl, JSON.stringify({body: '<p/>', url: '/', labels: {}, settings: {}}))

        expect(response.status).toBe(500)
        expect(createHashSpy).not.toHaveBeenCalled()
      } finally {
        await stopServer(server)
      }
    })
  })
})
