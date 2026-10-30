'use strict';

var http = require('http');
var crypto = require('crypto');
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

const logfmt = function(data, prefix = "") {
  const line = [];
  for (const key in data) {
    const outputKey = prefix ? `${prefix}.${key}` : key;
    let value = data[key];
    if (typeof value === "object" || Array.isArray(value)) {
      line.push(logfmt(value, outputKey));
      continue;
    }
    const isNull = value === null || value === void 0;
    value = isNull ? "" : String(value);
    const needsEscaping = value.includes('"') || value.includes("\\") || value.includes("\n");
    const needsQuoting = needsEscaping || value.includes(" ") || value.includes("=");
    if (needsEscaping) {
      value = value.replace(/["\\]/g, "\\$&");
      value = value.replace(/\n/g, "\\n");
    }
    if (needsQuoting) {
      value = '"' + value + '"';
    }
    if (value === "" && !isNull) {
      value = '""';
    }
    line.push(outputKey + "=" + value);
  }
  return line.join(" ");
};
const traceparentRegex = /^00-(?!0{32})([0-9a-f]{32})-(?!0{16})[0-9a-f]{16}-[0-9a-f]{2}$/;
const tracingIdRegex = /^[0-9a-fA-F]{32}$/;
const zeroTraceIdRegex = /^0{32}$/;
const getTraceId = (headers) => {
  const tracingId = headers["x-tracing-id"];
  if (typeof tracingId === "string" && tracingIdRegex.test(tracingId) && !zeroTraceIdRegex.test(tracingId)) {
    return tracingId;
  }
  const traceparent = headers["traceparent"];
  return typeof traceparent === "string" ? traceparentRegex.exec(traceparent)?.[1] : void 0;
};
const toError = (error) => error instanceof Error ? error : new Error(String(error));
const createServer = (renderToString, options = {}) => {
  const reportError = (error, context) => {
    if (!options.onError) {
      return;
    }
    try {
      options.onError(error, context);
    } catch (hookError) {
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          level: "error",
          message: "onError hook failed",
          error: toError(hookError).message
        })
      );
    }
  };
  return http__namespace.createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      response.statusCode = 200;
      response.write("ok");
      response.end();
      return;
    }
    if (request.method !== "POST") {
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          status: 405,
          method: request.method,
          url: request.url
        })
      );
      response.statusCode = 405;
      response.end();
      return;
    }
    const context = {
      traceId: getTraceId(request.headers)
    };
    try {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
      }
      const { body, url, labels, settings } = JSON.parse(Buffer.concat(chunks).toString());
      context.url = typeof url === "string" ? url : void 0;
      if (typeof body === "string") {
        context.bodyLength = body.length;
        context.bodyHash = crypto.createHash("sha256").update(body).digest("hex");
      }
      const convertedBody = convertHtmlSpecialitiesToComments(body);
      const results = await renderToString(convertedBody, {
        prettyHtml: false,
        url,
        runtimeLogging: true,
        beforeHydrate: (document) => {
          document.body.setAttribute("data-nlx-ssr-labels", JSON.stringify(labels));
          document.body.setAttribute("data-nlx-ssr-settings", JSON.stringify(settings));
        },
        afterHydrate: (document) => {
          document.body.removeAttribute("data-nlx-ssr-labels");
          document.body.removeAttribute("data-nlx-ssr-settings");
        }
      });
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          buildId: results?.buildId,
          url,
          status: results?.httpStatus,
          diagnostics: results?.diagnostics
        })
      );
      if (results.httpStatus !== 200) {
        console.log(
          logfmt({
            time: (/* @__PURE__ */ new Date()).toJSON(),
            status: 500,
            statusMessage: "Hydration error",
            method: request.method,
            url: request.url
          })
        );
        response.statusCode = 500;
        response.statusMessage = "Hydration error";
        response.end();
        const firstError = results.diagnostics?.find((diagnostic) => diagnostic.level === "error");
        reportError(new Error(`Hydration error: ${firstError?.messageText ?? `httpStatus ${results.httpStatus}`}`), {
          ...context,
          kind: "hydration",
          buildId: results.buildId,
          diagnostics: results.diagnostics
        });
        return;
      }
      const resultHtmlDocumentString = convertCommentsToHtmlSpecialities(
        isCompleteHtmlDocument(convertedBody) ? results.html ?? "" : extractFragments(results.html ?? "", !hasMetaCharsetTag(convertedBody))
      );
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(resultHtmlDocumentString);
      response.end();
    } catch (error) {
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          status: 500,
          error: error instanceof Error ? error.message : String(error)
        })
      );
      response.statusCode = 500;
      response.end();
      reportError(toError(error), { ...context, kind: "exception" });
    }
  });
};
const esiIncludeRegex = /<esi:include\s+src="([^"]*)"\s*\/?>/g;
const nbspRegex = /&nbsp;/g;
const esiIncludeCommentRegex = /<!-- ESI include: "([^"]*)" -->/g;
const nbspCommentRegex = /<!-- nlx-ssr-nbsp -->/g;
const convertHtmlSpecialitiesToComments = (html) => {
  return html.replace(esiIncludeRegex, '<!-- ESI include: "$1" -->').replace(nbspRegex, "<!-- nlx-ssr-nbsp -->");
};
const convertCommentsToHtmlSpecialities = (html) => {
  return html.replace(esiIncludeCommentRegex, '<esi:include src="$1" />').replace(nbspCommentRegex, "&nbsp;");
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
  const headElement = document.querySelector("head");
  if (removeMetaCharsetTag && headElement) {
    const metaCharset = headElement.querySelector('meta[charset="utf-8"]');
    if (metaCharset) {
      metaCharset.remove();
    }
  }
  const head = headElement ? headElement.toString() : "";
  const body = document.querySelector("body") ? document.querySelector("body").toString() : "";
  return head + body;
};

exports.createServer = createServer;
