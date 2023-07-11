"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const http = require("http");
const mock_doc_1 = require("@stencil/core/mock-doc");
const createServer = (renderToString) => {
    return http.createServer((request, response) => { var _a, request_1, request_1_1; return __awaiter(void 0, void 0, void 0, function* () {
        var _b, e_1, _c, _d;
        if (request.method !== 'POST') {
            response.statusCode = 405;
            response.end('Method not allowed');
            return;
        }
        try {
            const chunks = [];
            try {
                for (_a = true, request_1 = __asyncValues(request); request_1_1 = yield request_1.next(), _b = request_1_1.done, !_b; _a = true) {
                    _d = request_1_1.value;
                    _a = false;
                    const chunk = _d;
                    chunks.push(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = request_1.return)) yield _c.call(request_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const { body, url, labels, settings } = JSON.parse(Buffer.concat(chunks).toString());
            console.log(`Hydrating for ${url}`);
            const bodyWithoutEsiIncludes = convertEsiIncludesToComments(body);
            const results = yield renderToString(bodyWithoutEsiIncludes, {
                prettyHtml: true,
                url: url,
                beforeHydrate: (document) => {
                    document.body.setAttribute('data-nlx-ssr-labels', JSON.stringify(labels));
                    document.body.setAttribute('data-nlx-ssr-settings', JSON.stringify(settings));
                },
                afterHydrate: (document) => {
                    document.body.removeAttribute('data-nlx-ssr-labels');
                    document.body.removeAttribute('data-nlx-ssr-settings');
                }
            });
            if (results.httpStatus !== 200) {
                console.log(results);
                throw new Error('Error occurred rendering page');
            }
            const resultHtmlDocumentString = isCompleteHtmlDocument(bodyWithoutEsiIncludes)
                ? convertEsiCommentsToIncludes(results.html)
                : convertEsiCommentsToIncludes(extractFragments(results.html, !hasMetaCharsetTag(bodyWithoutEsiIncludes)));
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(resultHtmlDocumentString);
            response.end();
        }
        catch (error) {
            console.error('Error occurred handling', request.url, error);
            response.statusCode = 500;
            response.end('Internal server error');
        }
    }); });
};
exports.createServer = createServer;
const convertEsiIncludesToComments = (html) => {
    const includeRegex = /<esi:include\s+src="([^"]*)"\s*\/?>/g;
    const comment = '<!-- ESI include: $1 -->';
    return html.replace(includeRegex, comment);
};
const convertEsiCommentsToIncludes = (html) => {
    const commentRegex = /<!-- ESI include: ([^"]*) -->/g;
    const include = '<esi:include src="$1" />';
    return html.replace(commentRegex, include);
};
const isCompleteHtmlDocument = (html) => {
    return /<html\b[^>]*>/i.test(html) && /<head\b[^>]*>/i.test(html) && /<body\b[^>]*>/i.test(html);
};
const hasMetaCharsetTag = (html) => {
    return (0, mock_doc_1.parseHtmlToDocument)(html).querySelector('meta[charset]') !== null;
};
const extractFragments = (html, removeMetaCharsetTag) => {
    const document = (0, mock_doc_1.parseHtmlToDocument)(html);
    if (removeMetaCharsetTag) {
        const metaCharset = document.querySelector('meta[charset="utf-8"]');
        if (metaCharset) {
            metaCharset.remove();
        }
    }
    const head = document.querySelector('head') ? document.querySelector('head').toString() : '';
    const body = document.querySelector('body') ? document.querySelector('body').toString() : '';
    return head + body;
};
