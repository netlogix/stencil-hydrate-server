import * as http from 'http'
import {createHash} from 'crypto'
import {parseHtmlToDocument} from '@stencil/core/mock-doc'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'

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

export interface ServerErrorContext {
  /** `exception`: the request handler threw, `hydration`: renderToString reported a non-200 httpStatus */
  kind: 'exception' | 'hydration'
  /** URL of the page being rendered (from the request payload), not the URL of the hydrate server */
  url?: string
  /** Trace id of the incoming `X-Tracing-ID` header, or of the W3C `traceparent` header if there is no valid one */
  traceId?: string
  buildId?: string
  diagnostics?: HydrateResults['diagnostics']
  /** Size and SHA-256 of the HTML to hydrate, so identical inputs can be recognised without exposing the HTML */
  bodyLength?: number
  bodyHash?: string
}

export interface ServerOptions {
  /**
   * Called after the error response was sent. Must not rely on the response, and a throwing hook never
   * affects it: errors thrown or rejected by the hook are logged and swallowed. The hook may be async,
   * the server does not wait for it.
   */
  onError?: (error: Error, context: ServerErrorContext) => void | Promise<void>
}

const traceparentRegex = /^00-(?!0{32})([0-9a-f]{32})-(?!0{16})[0-9a-f]{16}-[0-9a-f]{2}$/
const tracingIdRegex = /^[0-9a-fA-F]{32}$/
const zeroTraceIdRegex = /^0{32}$/

const getTraceId = (headers: http.IncomingHttpHeaders): string | undefined => {
  const tracingId = headers['x-tracing-id']
  if (typeof tracingId === 'string' && tracingIdRegex.test(tracingId) && !zeroTraceIdRegex.test(tracingId)) {
    return tracingId
  }

  const traceparent = headers['traceparent']
  return typeof traceparent === 'string' ? traceparentRegex.exec(traceparent)?.[1] : undefined
}

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)))

export const createServer = (
  renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>,
  options: ServerOptions = {}
) => {
  const logHookError = (hookError: unknown) =>
    console.log(
      logfmt({
        time: new Date().toJSON(),
        level: 'error',
        message: 'onError hook failed',
        error: toError(hookError).message
      })
    )

  const reportError = (error: Error, context: ServerErrorContext) => {
    if (!options.onError) {
      return
    }

    try {
      // Promise.resolve also catches a hook that rejects instead of throwing
      Promise.resolve(options.onError(error, context)).catch(logHookError)
    } catch (hookError) {
      logHookError(hookError)
    }
  }

  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/healthz') {
      response.statusCode = 200
      response.write('ok')
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

    const context: Omit<ServerErrorContext, 'kind'> = {
      traceId: getTraceId(request.headers)
    }

    try {
      const chunks = []
      for await (const chunk of request) {
        chunks.push(chunk)
      }
      const {body, url, labels, settings} = JSON.parse(Buffer.concat(chunks).toString())

      context.url = typeof url === 'string' ? url : undefined
      // only needed for the hook, so servers without one do not pay for the hashing
      if (options.onError && typeof body === 'string') {
        context.bodyLength = body.length
        context.bodyHash = createHash('sha256').update(body).digest('hex')
      }

      const convertedBody = convertHtmlSpecialitiesToComments(body)

      const results = await renderToString(convertedBody, {
        prettyHtml: false,
        url: url,
        runtimeLogging: true,
        beforeHydrate: (document: any) => {
          document.body.setAttribute('data-nlx-ssr-labels', JSON.stringify(labels))
          document.body.setAttribute('data-nlx-ssr-settings', JSON.stringify(settings))
        },
        afterHydrate: (document: any) => {
          document.body.removeAttribute('data-nlx-ssr-labels')
          document.body.removeAttribute('data-nlx-ssr-settings')
        }
      })

      console.log(
        logfmt({
          time: new Date().toJSON(),
          buildId: results?.buildId,
          url: url,
          status: results?.httpStatus,
          diagnostics: results?.diagnostics
        })
      )

      if (results.httpStatus !== 200) {
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

        const firstError = results.diagnostics?.find(diagnostic => diagnostic.level === 'error')
        reportError(new Error(`Hydration error: ${firstError?.messageText ?? `httpStatus ${results.httpStatus}`}`), {
          ...context,
          kind: 'hydration',
          buildId: results.buildId,
          diagnostics: results.diagnostics
        })
        return
      }

      const resultHtmlDocumentString = convertCommentsToHtmlSpecialities(
        isCompleteHtmlDocument(convertedBody)
          ? (results.html ?? '')
          : extractFragments(results.html ?? '', !hasMetaCharsetTag(convertedBody))
      )

      response.writeHead(200, {'Content-Type': 'text/html'})
      response.write(resultHtmlDocumentString)
      response.end()
    } catch (error) {
      console.log(
        logfmt({
          time: new Date().toJSON(),
          status: 500,
          error: error instanceof Error ? error.message : String(error)
        })
      )
      response.statusCode = 500
      response.end()

      reportError(toError(error), {...context, kind: 'exception'})
    }
  })
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
