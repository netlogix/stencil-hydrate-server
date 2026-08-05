'use strict';

var http = require('http');
var mockDoc = require('@stencil/core/mock-doc');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var http__namespace = /*#__PURE__*/_interopNamespaceDefault(http);

/**
 * Based on https://github.com/csquared/node-logfmt/blob/master/lib/stringify.js with additions for nested objects
 * from https://github.com/buptliuhs/node-logfmt/blob/support-nested-object/lib/stringify.js adjusted to be able
 * to handle multidimensional nested objects/arrays and newline encoding.
 */
const logfmt = function (data, prefix = '') {
    const line = [];
    for (const key in data) {
        const outputKey = prefix ? `${prefix}.${key}` : key;
        let value = data[key];
        if (typeof value === 'object' || Array.isArray(value)) {
            line.push(logfmt(value, outputKey));
            continue;
        }
        const isNull = value === null || value === undefined;
        value = isNull ? '' : String(value);
        const needsEscaping = value.includes('"') || value.includes('\\') || value.includes('\n');
        const needsQuoting = needsEscaping || value.includes(' ') || value.includes('=');
        if (needsEscaping) {
            value = value.replace(/["\\]/g, '\\$&');
            value = value.replace(/\n/g, '\\n');
        }
        if (needsQuoting) {
            value = '"' + value + '"';
        }
        if (value === '' && !isNull) {
            value = '""';
        }
        line.push(outputKey + '=' + value);
    }
    return line.join(' ');
};
const createServer = (renderToString) => {
    return http__namespace.createServer(async (request, response) => {
        if (request.method === 'GET' && request.url === '/healthz') {
            response.statusCode = 200;
            response.write('ok');
            response.end();
            return;
        }
        if (request.method !== 'POST') {
            console.log(logfmt({
                time: new Date().toJSON(),
                status: 405,
                method: request.method,
                url: request.url
            }));
            response.statusCode = 405;
            response.end();
            return;
        }
        try {
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            const { body, url, labels, settings } = JSON.parse(Buffer.concat(chunks).toString());
            const convertedBody = convertHtmlSpecialitiesToComments(body);
            const results = await renderToString(convertedBody, {
                prettyHtml: false,
                url: url,
                runtimeLogging: true,
                beforeHydrate: (document) => {
                    document.body.setAttribute('data-nlx-ssr-labels', JSON.stringify(labels));
                    document.body.setAttribute('data-nlx-ssr-settings', JSON.stringify(settings));
                },
                afterHydrate: (document) => {
                    document.body.removeAttribute('data-nlx-ssr-labels');
                    document.body.removeAttribute('data-nlx-ssr-settings');
                }
            });
            console.log(logfmt({
                time: new Date().toJSON(),
                buildId: results?.buildId,
                url: url,
                status: results?.httpStatus,
                diagnostics: results?.diagnostics
            }));
            if (results.httpStatus !== 200) {
                console.log(logfmt({
                    time: new Date().toJSON(),
                    status: 500,
                    statusMessage: 'Hydration error',
                    method: request.method,
                    url: request.url
                }));
                response.statusCode = 500;
                response.statusMessage = 'Hydration error';
                response.end();
                return;
            }
            const resultHtmlDocumentString = convertCommentsToHtmlSpecialities(isCompleteHtmlDocument(convertedBody)
                ? (results.html ?? '')
                : extractFragments(results.html ?? '', !hasMetaCharsetTag(convertedBody)));
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(resultHtmlDocumentString);
            response.end();
        }
        catch (error) {
            console.log(logfmt({
                time: new Date().toJSON(),
                status: 500,
                error: error instanceof Error ? error.message : String(error)
            }));
            response.statusCode = 500;
            response.end();
        }
    });
};
const esiIncludeRegex = /<esi:include\s+src="([^"]*)"\s*\/?>/g;
const nbspRegex = /&nbsp;/g;
const esiIncludeCommentRegex = /<!-- ESI include: "([^"]*)" -->/g;
const nbspCommentRegex = /<!-- nlx-ssr-nbsp -->/g;
const convertHtmlSpecialitiesToComments = (html) => {
    return html.replace(esiIncludeRegex, '<!-- ESI include: "$1" -->').replace(nbspRegex, '<!-- nlx-ssr-nbsp -->');
};
const convertCommentsToHtmlSpecialities = (html) => {
    return html.replace(esiIncludeCommentRegex, '<esi:include src="$1" />').replace(nbspCommentRegex, '&nbsp;');
};
const isCompleteHtmlDocument = (html) => {
    return /<html\b[^>]*>/i.test(html) && /<head\b[^>]*>/i.test(html) && /<body\b[^>]*>/i.test(html);
};
const metaCharsetRegex = /<meta\s[^>]*charset\s*=\s*["']?[^"'\s/>]+["']?[^>]*>/i;
const hasMetaCharsetTag = (html) => {
    return metaCharsetRegex.test(html);
};
const extractFragments = (html, removeMetaCharsetTag) => {
    const document = mockDoc.parseHtmlToDocument(html);
    const headElement = document.querySelector('head');
    if (removeMetaCharsetTag && headElement) {
        const metaCharset = headElement.querySelector('meta[charset="utf-8"]');
        if (metaCharset) {
            metaCharset.remove();
        }
    }
    const head = headElement ? headElement.toString() : '';
    const body = document.querySelector('body') ? document.querySelector('body').toString() : '';
    return head + body;
};

exports.createServer = createServer;
