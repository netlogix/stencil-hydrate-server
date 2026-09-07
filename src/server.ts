import * as http from 'http'
import {parseHtmlToDocument} from '@stencil/core/mock-doc'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'
import {resolveServerOptions, type ServerOptions} from './options'
import {createSemaphore, QueueRejectedError, type RenderSlot} from './semaphore'
import {createMetrics, METRICS_CONTENT_TYPE, type RenderResult} from './metrics'

export type {ServerOptions} from './options'

/**
 * Based on https://github.com/csquared/node-logfmt/blob/master/lib/stringify.js with additions for nested objects
 * from https://github.com/buptliuhs/node-logfmt/blob/support-nested-object/lib/stringify.js adjusted to be able
 * to handle multidimensional nested objects/arrays and newline encoding.
 */
const logfmt = function (data: any, prefix: string = ''): string {
  const line = []

  for (const key in data) {
    const outputKey = prefix ? `${prefix}.${key}` : key

    let value = data[key]

    if (typeof value === 'object' || Array.isArray(value)) {
      line.push(logfmt(value, outputKey))
      continue
    }

    const isNull = value === null || value === undefined

    value = isNull ? '' : String(value)

    const needsEscaping = value.includes('"') || value.includes('\\') || value.includes('\n')
    const needsQuoting = needsEscaping || value.includes(' ') || value.includes('=')

    if (needsEscaping) {
      value = value.replace(/["\\]/g, '\\$&')
      value = value.replace(/\n/g, '\\n')
    }

    if (needsQuoting) {
      value = '"' + value + '"'
    }

    if (value === '' && !isNull) {
      value = '""'
    }

    line.push(outputKey + '=' + value)
  }

  return line.join(' ')
}

/**
 * Reads the request body, giving up as soon as it exceeds `maxBodySize`.
 *
 * `Content-Length` is checked up front where present, and the received bytes are counted while
 * streaming because chunked requests do not announce their size. Returns `null` when the limit
 * is exceeded.
 */
const readBody = async (request: http.IncomingMessage, maxBodySize: number): Promise<Buffer | null> => {
  const announcedLength = Number(request.headers['content-length'])

  if (Number.isFinite(announcedLength) && announcedLength > maxBodySize) {
    return null
  }

  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length

    if (size > maxBodySize) {
      return null
    }

    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

export const createServer = (
  renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>,
  serverOptions: ServerOptions = {}
) => {
  const {options, warnings} = resolveServerOptions(serverOptions)

  for (const warning of warnings) {
    console.log(logfmt({time: new Date().toJSON(), level: 'warn', message: warning}))
  }

  const semaphore = createSemaphore(options)
  const metrics = createMetrics({
    activeRenders: () => semaphore.active,
    queueDepth: () => semaphore.queued
  })

  const server = http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/healthz') {
      response.statusCode = 200
      response.write('ok')
      response.end()
      return
    }

    if (request.method === 'GET' && request.url === '/metrics') {
      response.writeHead(200, {'Content-Type': METRICS_CONTENT_TYPE})
      response.write(metrics.render())
      response.end()
      return
    }

    if (request.method !== 'POST') {
      console.log(
        logfmt({
          time: new Date().toJSON(),
          status: 405,
          method: request.method,
          url: request.url
        })
      )
      response.statusCode = 405
      response.end()
      return
    }

    const abortController = new AbortController()

    response.on('close', () => {
      if (!response.writableFinished) {
        abortController.abort()
      }
    })

    let outcome: RenderResult | undefined
    let renderAttempted = false

    try {
      const rawBody = await readBody(request, options.maxBodySize)

      if (rawBody === null) {
        metrics.countRejected('body_too_large')
        console.log(
          logfmt({
            time: new Date().toJSON(),
            status: 413,
            statusMessage: 'Request body too large',
            method: request.method,
            url: request.url,
            maxBodySize: options.maxBodySize
          })
        )
        response.setHeader('Connection', 'close')
        response.writeHead(413)
        response.end()
        return
      }

      const {body, url, labels, settings} = JSON.parse(rawBody.toString())

      const convertedBody = convertHtmlSpecialitiesToComments(body)

      let slot: RenderSlot

      try {
        slot = await semaphore.acquire(abortController.signal)
      } catch (error) {
        if (!(error instanceof QueueRejectedError)) {
          throw error
        }

        if (error.reason === 'aborted') {
          metrics.countRejected('client_disconnected')
          console.log(
            logfmt({
              time: new Date().toJSON(),
              status: 499,
              statusMessage: 'Client disconnected while queued',
              url: url
            })
          )
          response.destroy()
          return
        }

        metrics.countRejected(error.reason)
        console.log(
          logfmt({
            time: new Date().toJSON(),
            status: 503,
            statusMessage: 'Hydrate server busy',
            reason: error.reason,
            url: url,
            active: semaphore.active,
            queued: semaphore.queued
          })
        )
        response.writeHead(503, {'Retry-After': '1'})
        response.end()
        return
      }

      if (abortController.signal.aborted) {
        slot.release()
        metrics.countRejected('client_disconnected')
        console.log(
          logfmt({
            time: new Date().toJSON(),
            status: 499,
            statusMessage: 'Client disconnected before rendering',
            url: url
          })
        )
        response.destroy()
        return
      }

      metrics.observeQueueWait(slot.waitMs / 1000)

      let results: HydrateResults
      const renderStartedAt = Date.now()

      try {
        renderAttempted = true
        results = await renderToString(convertedBody, {
          prettyHtml: false,
          url: url,
          runtimeLogging: true,
          timeout: options.hydrateTimeout,
          beforeHydrate: (document: any) => {
            document.body.setAttribute('data-nlx-ssr-labels', JSON.stringify(labels))
            document.body.setAttribute('data-nlx-ssr-settings', JSON.stringify(settings))
          },
          afterHydrate: (document: any) => {
            document.body.removeAttribute('data-nlx-ssr-labels')
            document.body.removeAttribute('data-nlx-ssr-settings')
          }
        })
      } finally {
        metrics.observeRenderDuration((Date.now() - renderStartedAt) / 1000)
        slot.release()
      }

      console.log(
        logfmt({
          time: new Date().toJSON(),
          buildId: results?.buildId,
          url: url,
          status: results?.httpStatus,
          queueWaitMs: slot.waitMs,
          renderMs: Date.now() - renderStartedAt,
          diagnostics: results?.diagnostics
        })
      )

      if (results.httpStatus !== 200) {
        outcome = 'hydration_error'
        console.log(
          logfmt({
            time: new Date().toJSON(),
            status: 500,
            statusMessage: 'Hydration error',
            method: request.method,
            url: request.url
          })
        )
        response.statusCode = 500
        response.statusMessage = 'Hydration error'
        response.end()
        return
      }

      const resultHtmlDocumentString = convertCommentsToHtmlSpecialities(
        isCompleteHtmlDocument(convertedBody)
          ? (results.html ?? '')
          : extractFragments(results.html ?? '', !hasMetaCharsetTag(convertedBody))
      )

      outcome = 'ok'

      response.writeHead(200, {'Content-Type': 'text/html'})
      response.write(resultHtmlDocumentString)
      response.end()
    } catch (error) {
      if (renderAttempted) {
        outcome = 'error'
      }

      console.log(
        logfmt({
          time: new Date().toJSON(),
          status: 500,
          error: error instanceof Error ? error.message : String(error)
        })
      )
      response.statusCode = 500
      response.end()
    } finally {
      if (outcome !== undefined) {
        metrics.countRender(outcome)
      }
    }
  })

  server.requestTimeout = options.requestTimeout
  server.headersTimeout = options.headersTimeout

  server.on('close', () => metrics.close())

  return server
}

const esiIncludeRegex = /<esi:include\s+src="([^"]*)"\s*\/?>/g
const nbspRegex = /&nbsp;/g
const esiIncludeCommentRegex = /<!-- ESI include: "([^"]*)" -->/g
const nbspCommentRegex = /<!-- nlx-ssr-nbsp -->/g

const convertHtmlSpecialitiesToComments = (html: string) => {
  return html.replace(esiIncludeRegex, '<!-- ESI include: "$1" -->').replace(nbspRegex, '<!-- nlx-ssr-nbsp -->')
}

const convertCommentsToHtmlSpecialities = (html: string) => {
  return html.replace(esiIncludeCommentRegex, '<esi:include src="$1" />').replace(nbspCommentRegex, '&nbsp;')
}

const isCompleteHtmlDocument = (html: string) => {
  return /<html\b[^>]*>/i.test(html) && /<head\b[^>]*>/i.test(html) && /<body\b[^>]*>/i.test(html)
}

const metaCharsetRegex = /<meta\s[^>]*charset\s*=\s*["']?[^"'\s/>]+["']?[^>]*>/i

const hasMetaCharsetTag = (html: string) => {
  return metaCharsetRegex.test(html)
}

const extractFragments = (html: string, removeMetaCharsetTag: boolean) => {
  const document = parseHtmlToDocument(html)

  const headElement = document.querySelector('head')

  if (removeMetaCharsetTag && headElement) {
    const metaCharset = headElement.querySelector('meta[charset="utf-8"]')
    if (metaCharset) {
      metaCharset.remove()
    }
  }

  const head = headElement ? headElement.toString() : ''
  const body = document.querySelector('body') ? document.querySelector('body').toString() : ''

  return head + body
}
