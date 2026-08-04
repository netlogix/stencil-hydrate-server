import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {Server} from 'http'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'
import {createServer} from './server'

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

const startServer = async (renderToString: RenderToString) => {
  const server = createServer(renderToString)
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
})
