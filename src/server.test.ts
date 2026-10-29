import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {Server} from 'http'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'
import {createServer, type ServerOptions} from './server'

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

const startServer = async (renderToString: RenderToString, options: ServerOptions = {}) => {
  const server = createServer(renderToString, options)
  await new Promise<void>(resolve => server.listen(0, resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('expected server to listen on a port')
  }
  return {server, baseUrl: `http://127.0.0.1:${address.port}`}
}

const stopServer = (server: Server) =>
  new Promise<void>(resolve => {
    server.close(() => resolve())
    server.closeAllConnections()
  })

describe('createServer', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
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

  it('responds with 400 and no body when the request body is not valid JSON', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {method: 'POST', body: 'not-json'})
      const body = await response.text()

      expect(response.status).toBe(400)
      expect(body).toBe('')
      expect(renderToString).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=400'))
    } finally {
      await stopServer(server)
    }
  })

  it.each([
    ['a missing body', {url: '/page'}],
    ['a non-string body', {body: 42, url: '/page'}],
    ['a JSON array', ['<p>hi</p>']],
    ['JSON null', null]
  ])('responds with 400 for %s', async (_case, payload) => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString)

    try {
      const response = await fetch(baseUrl, {method: 'POST', body: JSON.stringify(payload)})

      expect(response.status).toBe(400)
      expect(renderToString).not.toHaveBeenCalled()

      const metricsBody = await (await fetch(`${baseUrl}/metrics`)).text()

      expect(metricsBody).toContain('hydrate_requests_rejected_total{reason="bad_request"} 1')
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
})

describe('createServer render concurrency', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  const postPage = (baseUrl: string, init: RequestInit = {}) =>
    fetch(baseUrl, {
      method: 'POST',
      body: JSON.stringify({body: '<p>hi</p>', url: '/page', labels: {}, settings: {}}),
      ...init
    })

  /**
   * A render that only finishes when the test says so, which is how the tests below occupy a
   * render slot for a controlled amount of time.
   */
  const createBlockingRender = () => {
    const started: Array<() => void> = []
    let releaseAll: () => void = () => undefined
    const gate = new Promise<void>(resolve => {
      releaseAll = resolve
    })

    const renderToString = vi.fn(async () => {
      started.forEach(notify => notify())
      await gate
      return buildHydrateResults({html: '<html><head></head><body><p>hi</p></body></html>'})
    })

    const firstCall = new Promise<void>(resolve => started.push(resolve))

    return {renderToString, firstCall, releaseAll: () => releaseAll()}
  }

  it('never runs more renders at once than maxConcurrency, even under 30 parallel requests', async () => {
    let concurrent = 0
    let peak = 0

    const renderToString = vi.fn(async () => {
      concurrent++
      peak = Math.max(peak, concurrent)
      await new Promise(resolve => setTimeout(resolve, 5))
      concurrent--
      return buildHydrateResults({html: '<html><head></head><body><p>hi</p></body></html>'})
    })

    const {server, baseUrl} = await startServer(renderToString, {
      maxConcurrency: 1,
      maxQueue: 64,
      queueWaitTimeout: 10_000
    })

    try {
      const responses = await Promise.all(Array.from({length: 30}, () => postPage(baseUrl)))

      expect(responses.every(response => response.status === 200)).toBe(true)
      expect(renderToString).toHaveBeenCalledTimes(30)
      expect(peak).toBe(1)
    } finally {
      await stopServer(server)
    }
  })

  it('passes the configured hydrate timeout to renderToString', async () => {
    const renderToString = vi.fn().mockResolvedValue(buildHydrateResults({html: '<p>hi</p>'}))
    const {server, baseUrl} = await startServer(renderToString, {hydrateTimeout: 3000})

    try {
      await postPage(baseUrl)

      expect(renderToString).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({timeout: 3000}))
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 503 and Retry-After when the queue is full', async () => {
    const {renderToString, firstCall, releaseAll} = createBlockingRender()
    const {server, baseUrl} = await startServer(renderToString, {
      maxConcurrency: 1,
      maxQueue: 0,
      queueWaitTimeout: 10_000
    })

    try {
      const blocking = postPage(baseUrl)
      await firstCall

      const rejected = await postPage(baseUrl)

      expect(rejected.status).toBe(503)
      expect(rejected.headers.get('retry-after')).toBe('1')
      expect(renderToString).toHaveBeenCalledTimes(1)

      releaseAll()
      expect((await blocking).status).toBe(200)
    } finally {
      releaseAll()
      await stopServer(server)
    }
  })

  it('responds with 503 when the queue wait budget is exhausted', async () => {
    const {renderToString, firstCall, releaseAll} = createBlockingRender()
    const {server, baseUrl} = await startServer(renderToString, {
      maxConcurrency: 1,
      maxQueue: 8,
      queueWaitTimeout: 50
    })

    try {
      const blocking = postPage(baseUrl)
      await firstCall

      const timedOut = await postPage(baseUrl)

      expect(timedOut.status).toBe(503)
      expect(renderToString).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('reason=queue_timeout'))

      releaseAll()
      await blocking
    } finally {
      releaseAll()
      await stopServer(server)
    }
  })

  it('keeps /healthz and /metrics reachable while every render slot is busy', async () => {
    const {renderToString, firstCall, releaseAll} = createBlockingRender()
    const {server, baseUrl} = await startServer(renderToString, {
      maxConcurrency: 1,
      maxQueue: 8,
      queueWaitTimeout: 10_000
    })

    try {
      const blocking = postPage(baseUrl)
      await firstCall

      const [health, metrics] = await Promise.all([fetch(`${baseUrl}/healthz`), fetch(`${baseUrl}/metrics`)])
      const metricsBody = await metrics.text()

      expect(health.status).toBe(200)
      expect(await health.text()).toBe('ok')
      expect(metrics.status).toBe(200)
      expect(metrics.headers.get('content-type')).toContain('text/plain')
      expect(metricsBody).toContain('hydrate_renders_active 1')

      releaseAll()
      await blocking
    } finally {
      releaseAll()
      await stopServer(server)
    }
  })

  it('reports render outcomes and rejections on /metrics', async () => {
    const renderToString = vi.fn().mockResolvedValue(buildHydrateResults({httpStatus: 404}))
    const {server, baseUrl} = await startServer(renderToString, {maxBodySize: 128})

    try {
      expect((await postPage(baseUrl)).status).toBe(500)
      expect((await fetch(baseUrl, {method: 'POST', body: 'x'.repeat(300)})).status).toBe(413)

      const metricsBody = await (await fetch(`${baseUrl}/metrics`)).text()

      expect(metricsBody).toContain('hydrate_renders_total{result="hydration_error"} 1')
      expect(metricsBody).toContain('hydrate_requests_rejected_total{reason="body_too_large"} 1')
    } finally {
      await stopServer(server)
    }
  })

  it('counts a render that exceeded the hydrate timeout separately from other hydration errors', async () => {
    const renderToString = vi.fn().mockResolvedValue(
      buildHydrateResults({
        httpStatus: null as unknown as number,
        diagnostics: [
          {
            level: 'error',
            type: 'build',
            header: 'Hydrate Error',
            messageText: 'Hydrate exceeded timeout, waiting on: <my-component>',
            lines: []
          }
        ]
      })
    )
    const {server, baseUrl} = await startServer(renderToString)

    try {
      expect((await postPage(baseUrl)).status).toBe(500)

      const metricsBody = await (await fetch(`${baseUrl}/metrics`)).text()

      expect(metricsBody).toContain('hydrate_renders_total{result="timeout"} 1')
      expect(metricsBody).toContain('hydrate_renders_total{result="hydration_error"} 0')
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('statusMessage="Hydration timeout"'))
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 413 for a body larger than maxBodySize without rendering', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString, {maxBodySize: 64})

    try {
      const response = await fetch(baseUrl, {method: 'POST', body: 'x'.repeat(200)})

      expect(response.status).toBe(413)
      expect(renderToString).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=413'))
    } finally {
      await stopServer(server)
    }
  })

  it('responds with 413 for an oversized chunked body that announces no length', async () => {
    const renderToString = vi.fn()
    const {server, baseUrl} = await startServer(renderToString, {maxBodySize: 64})

    try {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('x'.repeat(200)))
          controller.close()
        }
      })

      const response = await fetch(baseUrl, {method: 'POST', body, duplex: 'half'} as RequestInit)

      expect(response.status).toBe(413)
      expect(renderToString).not.toHaveBeenCalled()
    } finally {
      await stopServer(server)
    }
  })

  it('drops a queued request instead of rendering it once the caller has disconnected', async () => {
    const {renderToString, firstCall, releaseAll} = createBlockingRender()
    const {server, baseUrl} = await startServer(renderToString, {
      maxConcurrency: 1,
      maxQueue: 8,
      queueWaitTimeout: 10_000
    })

    try {
      const blocking = postPage(baseUrl)
      await firstCall

      const abortController = new AbortController()
      const abandoned = postPage(baseUrl, {signal: abortController.signal})

      await new Promise(resolve => setTimeout(resolve, 20))
      abortController.abort()
      await expect(abandoned).rejects.toThrow()
      await new Promise(resolve => setTimeout(resolve, 20))

      releaseAll()
      expect((await blocking).status).toBe(200)
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(renderToString).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('status=499'))
    } finally {
      releaseAll()
      await stopServer(server)
    }
  })

  it('logs a warning when the configured options are inconsistent', async () => {
    const renderToString = vi.fn()
    const {server} = await startServer(renderToString, {headersTimeout: 8000, requestTimeout: 6000})

    try {
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('level=warn'))
      expect(server.headersTimeout).toBe(6000)
    } finally {
      await stopServer(server)
    }
  })
})
