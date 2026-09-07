'use strict';

var http = require('http');
var mockDoc = require('@stencil/core/mock-doc');
var perf_hooks = require('perf_hooks');

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

const DEFAULT_SERVER_OPTIONS = {
  maxConcurrency: 1,
  maxQueue: 32,
  queueWaitTimeout: 2e3,
  hydrateTimeout: 5e3,
  requestTimeout: 1e4,
  headersTimeout: 5e3,
  maxBodySize: 2 * 1024 * 1024
};
const ENV_VARIABLE_NAMES = {
  maxConcurrency: "HYDRATE_CONCURRENCY",
  maxQueue: "HYDRATE_MAX_QUEUE",
  queueWaitTimeout: "HYDRATE_QUEUE_WAIT_TIMEOUT",
  hydrateTimeout: "HYDRATE_TIMEOUT",
  requestTimeout: "HYDRATE_REQUEST_TIMEOUT",
  headersTimeout: "HYDRATE_HEADERS_TIMEOUT",
  maxBodySize: "HYDRATE_MAX_BODY_SIZE"
};
const MINIMUM_VALUES = {
  maxConcurrency: 1,
  maxQueue: 0,
  queueWaitTimeout: 0,
  hydrateTimeout: 1,
  requestTimeout: 0,
  headersTimeout: 0,
  maxBodySize: 1
};
const OPTION_NAMES = Object.keys(DEFAULT_SERVER_OPTIONS);
const isUsable = (value, minimum) => typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= minimum;
const resolveServerOptions = (options = {}, env = process.env) => {
  const warnings = [];
  const resolved = { ...DEFAULT_SERVER_OPTIONS };
  for (const name of OPTION_NAMES) {
    const minimum = MINIMUM_VALUES[name];
    const envName = ENV_VARIABLE_NAMES[name];
    const given = options[name];
    if (given !== void 0) {
      if (isUsable(given, minimum)) {
        resolved[name] = given;
        continue;
      }
      warnings.push(
        `option "${name}" must be an integer >= ${minimum}, got ${JSON.stringify(given)}; using ${resolved[name]}`
      );
      continue;
    }
    const fromEnv = env[envName];
    if (fromEnv === void 0 || fromEnv.trim() === "") {
      continue;
    }
    const parsed = Number(fromEnv);
    if (isUsable(parsed, minimum)) {
      resolved[name] = parsed;
      continue;
    }
    warnings.push(
      `${envName} must be an integer >= ${minimum}, got ${JSON.stringify(fromEnv)}; using ${resolved[name]}`
    );
  }
  warnings.push(...validateServerOptions(resolved));
  return { options: resolved, warnings };
};
const validateServerOptions = (options) => {
  const warnings = [];
  const budget = options.queueWaitTimeout + options.hydrateTimeout;
  if (options.requestTimeout > 0 && budget >= options.requestTimeout) {
    warnings.push(
      `queueWaitTimeout (${options.queueWaitTimeout}ms) + hydrateTimeout (${options.hydrateTimeout}ms) >= requestTimeout (${options.requestTimeout}ms): renders can outlive their request. Lower ${ENV_VARIABLE_NAMES.queueWaitTimeout} or ${ENV_VARIABLE_NAMES.hydrateTimeout}, or raise ${ENV_VARIABLE_NAMES.requestTimeout}.`
    );
  }
  return warnings;
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
class QueueRejectedError extends Error {
  constructor(reason) {
    super(`render slot not acquired: ${reason}`);
    __publicField(this, "reason");
    this.name = "QueueRejectedError";
    this.reason = reason;
  }
}
const createSemaphore = ({ maxConcurrency, maxQueue, queueWaitTimeout }) => {
  let active = 0;
  const waiting = [];
  const createSlot = (waitMs) => {
    let released = false;
    return {
      waitMs,
      release: () => {
        if (released) {
          return;
        }
        released = true;
        active--;
        dispatch();
      }
    };
  };
  const dispatch = () => {
    while (active < maxConcurrency && waiting.length > 0) {
      const waiter = waiting.shift();
      if (waiter) {
        waiter.grant();
      }
    }
  };
  const acquire = (signal) => {
    if (signal?.aborted) {
      return Promise.reject(new QueueRejectedError("aborted"));
    }
    if (active < maxConcurrency) {
      active++;
      return Promise.resolve(createSlot(0));
    }
    if (waiting.length >= maxQueue) {
      return Promise.reject(new QueueRejectedError("queue_full"));
    }
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
      let settled = false;
      const remove = () => {
        const index = waiting.indexOf(waiter);
        if (index >= 0) {
          waiting.splice(index, 1);
        }
      };
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      const fail = (reason) => {
        if (settled) {
          return;
        }
        settled = true;
        remove();
        cleanup();
        reject(new QueueRejectedError(reason));
      };
      const onAbort = () => fail("aborted");
      const timer = setTimeout(() => fail("queue_timeout"), queueWaitTimeout);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
      signal?.addEventListener("abort", onAbort, { once: true });
      const waiter = {
        grant: () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          active++;
          resolve(createSlot(Date.now() - startedAt));
        }
      };
      waiting.push(waiter);
    });
  };
  return {
    acquire,
    get active() {
      return active;
    },
    get queued() {
      return waiting.length;
    }
  };
};

const METRICS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";
const RENDER_RESULTS = ["ok", "hydration_error", "error"];
const REJECTION_REASONS = ["queue_full", "queue_timeout", "body_too_large", "client_disconnected"];
const RENDER_DURATION_BUCKETS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const QUEUE_WAIT_BUCKETS = [1e-3, 5e-3, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5];
const GC_DURATION_BUCKETS = [5e-4, 1e-3, 5e-3, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1];
const escapeLabelValue = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
const createCounter = (name, help, labelName, labelValues) => {
  const values = new Map(labelValues.map((labelValue) => [labelValue, 0]));
  return {
    increment: (labelValue) => {
      values.set(labelValue, (values.get(labelValue) ?? 0) + 1);
    },
    collect: () => {
      const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} counter`];
      for (const [labelValue, value] of values) {
        lines.push(`${name}{${labelName}="${escapeLabelValue(labelValue)}"} ${value}`);
      }
      return lines;
    }
  };
};
const createGauge = (name, help, read) => ({
  collect: () => [`# HELP ${name} ${help}`, `# TYPE ${name} gauge`, `${name} ${read()}`]
});
const createHistogram = (name, help, bounds) => {
  const counts = bounds.map(() => 0);
  let sum = 0;
  let count = 0;
  return {
    observe: (value) => {
      count++;
      sum += value;
      bounds.forEach((bound, index) => {
        if (value <= bound) {
          counts[index] = (counts[index] ?? 0) + 1;
        }
      });
    },
    collect: () => {
      const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} histogram`];
      bounds.forEach((bound, index) => {
        lines.push(`${name}_bucket{le="${bound}"} ${counts[index] ?? 0}`);
      });
      lines.push(`${name}_bucket{le="+Inf"} ${count}`);
      lines.push(`${name}_sum ${sum}`);
      lines.push(`${name}_count ${count}`);
      return lines;
    }
  };
};
const createMetrics = ({ activeRenders, queueDepth }) => {
  const renders = createCounter(
    "hydrate_renders_total",
    "Total number of finished renders by outcome.",
    "result",
    RENDER_RESULTS
  );
  const rejected = createCounter(
    "hydrate_requests_rejected_total",
    "Total number of requests rejected before rendering.",
    "reason",
    REJECTION_REASONS
  );
  const renderDuration = createHistogram(
    "hydrate_render_duration_seconds",
    "Time spent inside renderToString.",
    RENDER_DURATION_BUCKETS
  );
  const queueWait = createHistogram(
    "hydrate_queue_wait_seconds",
    "Time spent waiting for a render slot.",
    QUEUE_WAIT_BUCKETS
  );
  const gcDuration = createHistogram(
    "nodejs_gc_duration_seconds",
    "Garbage collection pause durations.",
    GC_DURATION_BUCKETS
  );
  const collectables = [
    createGauge("hydrate_renders_active", "Renders currently in progress.", activeRenders),
    createGauge("hydrate_queue_depth", "Requests currently waiting for a render slot.", queueDepth),
    renders,
    rejected,
    renderDuration,
    queueWait,
    createGauge("nodejs_heap_size_used_bytes", "Used heap size in bytes.", () => process.memoryUsage().heapUsed),
    createGauge("nodejs_heap_size_total_bytes", "Total heap size in bytes.", () => process.memoryUsage().heapTotal),
    gcDuration
  ];
  let observer;
  try {
    observer = new perf_hooks.PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        gcDuration.observe(entry.duration / 1e3);
      }
    });
    observer.observe({ entryTypes: ["gc"] });
  } catch {
    observer = void 0;
  }
  return {
    countRender: (result) => renders.increment(result),
    countRejected: (reason) => rejected.increment(reason),
    observeQueueWait: (seconds) => queueWait.observe(seconds),
    observeRenderDuration: (seconds) => renderDuration.observe(seconds),
    render: () => `${collectables.flatMap((collectable) => collectable.collect()).join("\n")}
`,
    close: () => {
      observer?.disconnect();
      observer = void 0;
    }
  };
};

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
const readBody = async (request, maxBodySize) => {
  const announcedLength = Number(request.headers["content-length"]);
  if (Number.isFinite(announcedLength) && announcedLength > maxBodySize) {
    return null;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodySize) {
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};
const createServer = (renderToString, serverOptions = {}) => {
  const { options, warnings } = resolveServerOptions(serverOptions);
  for (const warning of warnings) {
    console.log(logfmt({ time: (/* @__PURE__ */ new Date()).toJSON(), level: "warn", message: warning }));
  }
  const semaphore = createSemaphore(options);
  const metrics = createMetrics({
    activeRenders: () => semaphore.active,
    queueDepth: () => semaphore.queued
  });
  const server = http__namespace.createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      response.statusCode = 200;
      response.write("ok");
      response.end();
      return;
    }
    if (request.method === "GET" && request.url === "/metrics") {
      response.writeHead(200, { "Content-Type": METRICS_CONTENT_TYPE });
      response.write(metrics.render());
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
    const abortController = new AbortController();
    response.on("close", () => {
      if (!response.writableFinished) {
        abortController.abort();
      }
    });
    let outcome;
    let renderAttempted = false;
    try {
      const rawBody = await readBody(request, options.maxBodySize);
      if (rawBody === null) {
        metrics.countRejected("body_too_large");
        console.log(
          logfmt({
            time: (/* @__PURE__ */ new Date()).toJSON(),
            status: 413,
            statusMessage: "Request body too large",
            method: request.method,
            url: request.url,
            maxBodySize: options.maxBodySize
          })
        );
        response.setHeader("Connection", "close");
        response.writeHead(413);
        response.end();
        return;
      }
      const { body, url, labels, settings } = JSON.parse(rawBody.toString());
      const convertedBody = convertHtmlSpecialitiesToComments(body);
      let slot;
      try {
        slot = await semaphore.acquire(abortController.signal);
      } catch (error) {
        if (!(error instanceof QueueRejectedError)) {
          throw error;
        }
        if (error.reason === "aborted") {
          metrics.countRejected("client_disconnected");
          console.log(
            logfmt({
              time: (/* @__PURE__ */ new Date()).toJSON(),
              status: 499,
              statusMessage: "Client disconnected while queued",
              url
            })
          );
          response.destroy();
          return;
        }
        metrics.countRejected(error.reason);
        console.log(
          logfmt({
            time: (/* @__PURE__ */ new Date()).toJSON(),
            status: 503,
            statusMessage: "Hydrate server busy",
            reason: error.reason,
            url,
            active: semaphore.active,
            queued: semaphore.queued
          })
        );
        response.writeHead(503, { "Retry-After": "1" });
        response.end();
        return;
      }
      if (abortController.signal.aborted) {
        slot.release();
        metrics.countRejected("client_disconnected");
        console.log(
          logfmt({
            time: (/* @__PURE__ */ new Date()).toJSON(),
            status: 499,
            statusMessage: "Client disconnected before rendering",
            url
          })
        );
        response.destroy();
        return;
      }
      metrics.observeQueueWait(slot.waitMs / 1e3);
      let results;
      const renderStartedAt = Date.now();
      try {
        renderAttempted = true;
        results = await renderToString(convertedBody, {
          prettyHtml: false,
          url,
          runtimeLogging: true,
          timeout: options.hydrateTimeout,
          beforeHydrate: (document) => {
            document.body.setAttribute("data-nlx-ssr-labels", JSON.stringify(labels));
            document.body.setAttribute("data-nlx-ssr-settings", JSON.stringify(settings));
          },
          afterHydrate: (document) => {
            document.body.removeAttribute("data-nlx-ssr-labels");
            document.body.removeAttribute("data-nlx-ssr-settings");
          }
        });
      } finally {
        metrics.observeRenderDuration((Date.now() - renderStartedAt) / 1e3);
        slot.release();
      }
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          buildId: results?.buildId,
          url,
          status: results?.httpStatus,
          queueWaitMs: slot.waitMs,
          renderMs: Date.now() - renderStartedAt,
          diagnostics: results?.diagnostics
        })
      );
      if (results.httpStatus !== 200) {
        outcome = "hydration_error";
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
        return;
      }
      const resultHtmlDocumentString = convertCommentsToHtmlSpecialities(
        isCompleteHtmlDocument(convertedBody) ? results.html ?? "" : extractFragments(results.html ?? "", !hasMetaCharsetTag(convertedBody))
      );
      outcome = "ok";
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(resultHtmlDocumentString);
      response.end();
    } catch (error) {
      if (renderAttempted) {
        outcome = "error";
      }
      console.log(
        logfmt({
          time: (/* @__PURE__ */ new Date()).toJSON(),
          status: 500,
          error: error instanceof Error ? error.message : String(error)
        })
      );
      response.statusCode = 500;
      response.end();
    } finally {
      if (outcome !== void 0) {
        metrics.countRender(outcome);
      }
    }
  });
  server.requestTimeout = options.requestTimeout;
  server.headersTimeout = options.headersTimeout;
  server.on("close", () => metrics.close());
  return server;
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
