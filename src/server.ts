import * as http from 'http'
import {parseHtmlToDocument} from '@stencil/core/mock-doc'
import type {HydrateResults, SerializeDocumentOptions} from '@stencil/core/internal'

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

      console.log(`Hydrating for ${url}`)

      const bodyWithoutEsiIncludes = convertEsiIncludesToComments(body)

      const results = await renderToString(bodyWithoutEsiIncludes, {
        prettyHtml: true,
        url: url,
        beforeHydrate: (document: any) => {
          document.body.setAttribute('data-nlx-ssr-labels', JSON.stringify(labels))
          document.body.setAttribute('data-nlx-ssr-settings', JSON.stringify(settings))
        },
        afterHydrate: (document: any) => {
          document.body.removeAttribute('data-nlx-ssr-labels')
          document.body.removeAttribute('data-nlx-ssr-settings')
        }
      })

      if (results.httpStatus !== 200) {
        console.log(results)
        throw new Error('Error occurred rendering page')
      }

      const resultHtmlDocumentString = isCompleteHtmlDocument(bodyWithoutEsiIncludes)
        ? convertEsiCommentsToIncludes(results.html)
        : convertEsiCommentsToIncludes(extractFragments(results.html, !hasMetaCharsetTag(bodyWithoutEsiIncludes)))

      response.writeHead(200, {'Content-Type': 'text/html'})
      response.write(resultHtmlDocumentString)
      response.end()
    } catch (error) {
      console.error('Error occurred handling', request.url, error)
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
