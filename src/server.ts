import * as http from 'http'
import {parseHtmlToDocument} from '@stencil/core/mock-doc'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'

/**
 * Based on https://github.com/csquared/node-logfmt/blob/master/lib/stringify.js with additions for nested objects
 * from https://github.com/buptliuhs/node-logfmt/blob/support-nested-object/lib/stringify.js adjusted to be able
 * to handle multidimensional nested objects/arrays and newline encoding.
 */
const logfmt = function(data: any, prefix: string = ''): string {
  const line = []

  for (const key in data) {
    const outputKey = prefix
      ? `${prefix}.${key}`
      : key

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

export const createServer = (
  renderToString: (html: string | any, options?: SerializeDocumentOptions) => Promise<HydrateResults>
) => {
  return http.createServer(async (request, response) => {
    if (request.method !== 'POST') {
      response.statusCode = 405
      response.end('Method not allowed')
      return
    }

    try {
      const chunks = []
      for await (const chunk of request) {
        chunks.push(chunk)
      }
      const {body, url, labels, settings} = JSON.parse(Buffer.concat(chunks).toString())

      const bodyWithoutEsiIncludes = convertEsiIncludesToComments(body)

      const results = await renderToString(bodyWithoutEsiIncludes, {
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

      console.log(logfmt({
        time: new Date().toJSON(),
        buildId: results?.buildId,
        url: url,
        status: results?.httpStatus,
        diagnostics: results?.diagnostics
      }))

      if (results.httpStatus !== 200) {
        response.statusCode = 500
        response.end('Hydration error')
      }

      const resultHtmlDocumentString = isCompleteHtmlDocument(bodyWithoutEsiIncludes)
        ? convertEsiCommentsToIncludes(results.html ?? '')
        : convertEsiCommentsToIncludes(extractFragments(results.html ?? '', !hasMetaCharsetTag(bodyWithoutEsiIncludes)))

      response.writeHead(200, {'Content-Type': 'text/html'})
      response.write(resultHtmlDocumentString)
      response.end()
    } catch (error) {
      response.statusCode = 500
      response.end('Internal server error')
    }
  })
}

const convertEsiIncludesToComments = (html: string) => {
  const includeRegex = /<esi:include\s+src="([^"]*)"\s*\/?>/g
  const comment = '<!-- ESI include: "$1" -->'
  return html.replace(includeRegex, comment)
}

const convertEsiCommentsToIncludes = (html: string) => {
  const commentRegex = /<!-- ESI include: "([^"]*)" -->/g
  const include = '<esi:include src="$1" />'
  return html.replace(commentRegex, include)
}

const isCompleteHtmlDocument = (html: string) => {
  return /<html\b[^>]*>/i.test(html) && /<head\b[^>]*>/i.test(html) && /<body\b[^>]*>/i.test(html)
}

const hasMetaCharsetTag = (html: string) => {
  return parseHtmlToDocument(html).querySelector('meta[charset]') !== null
}

const extractFragments = (html: string, removeMetaCharsetTag: boolean) => {
  const document = parseHtmlToDocument(html)

  if (removeMetaCharsetTag) {
    const metaCharset = document.querySelector('meta[charset="utf-8"]')
    if (metaCharset) {
      metaCharset.remove()
    }
  }

  const head = document.querySelector('head') ? document.querySelector('head').toString() : ''

  const body = document.querySelector('body') ? document.querySelector('body').toString() : ''

  return head + body
}
