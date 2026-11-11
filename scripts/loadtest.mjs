#!/usr/bin/env node
/**
 * Load test for a running hydrate server.
 *
 * This reproduces the failure mode the concurrency limit guards against. Before the limit was
 * introduced, sequential load kept memory flat while parallel load pushed the process into a
 * spiral: renders overran Stencil's `timeout`, `finalizeHydrate` closed their windows while
 * component promises were still pending, unrelated components started failing, retained memory
 * grew and garbage collection began to dominate the single thread until the heap ran out.
 *
 * Run the same request count twice, once with --sequential and once with a high --concurrency,
 * and compare heap and GC pause time. They should now look alike.
 *
 * Usage:
 *   node scripts/loadtest.mjs --url http://localhost:8080 --requests 300 --concurrency 30
 *   node scripts/loadtest.mjs --url http://localhost:8080 --requests 300 --sequential
 *   node scripts/loadtest.mjs --url http://localhost:8080 --html ./page.html
 */
import {readFile} from 'node:fs/promises'
import {parseArgs} from 'node:util'

const {values} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://localhost:8080'},
    requests: {type: 'string', default: '300'},
    concurrency: {type: 'string', default: '30'},
    html: {type: 'string'},
    sequential: {type: 'boolean', default: false},
    help: {type: 'boolean', default: false}
  }
})

if (values.help) {
  console.log(await readFile(new URL(import.meta.url)).then(buffer => buffer.toString().split('*/')[0]))
  process.exit(0)
}

const baseUrl = values.url.replace(/\/$/, '')
const totalRequests = Number(values.requests)
const concurrency = values.sequential ? 1 : Number(values.concurrency)

const DEFAULT_HTML = `<!doctype html>
<html><head><title>load test</title></head>
<body>${'<p>hydrate me</p>'.repeat(200)}</body></html>`

const html = values.html ? await readFile(values.html, 'utf8') : DEFAULT_HTML

const payload = JSON.stringify({body: html, url: '/loadtest', labels: {}, settings: {}})

const readMetrics = async () => {
  try {
    const response = await fetch(`${baseUrl}/metrics`)

    if (!response.ok) {
      return null
    }

    const body = await response.text()
    const value = name => {
      const line = body.split('\n').find(candidate => candidate.startsWith(`${name} `))
      return line ? Number(line.slice(name.length + 1)) : null
    }

    return {
      heapUsed: value('nodejs_heap_size_used_bytes'),
      gcSeconds: value('nodejs_gc_duration_seconds_sum'),
      gcCount: value('nodejs_gc_duration_seconds_count')
    }
  } catch {
    return null
  }
}

const percentile = (sorted, fraction) => {
  if (sorted.length === 0) {
    return 0
  }
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))
  return sorted[index]
}

const mib = bytes => (bytes === null ? 'n/a' : `${(bytes / 1024 / 1024).toFixed(1)} MiB`)

const statuses = new Map()
const durations = []
let networkErrors = 0
let pending = 0
let issued = 0

const runOne = async () => {
  const startedAt = performance.now()

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: payload
    })
    await response.arrayBuffer()
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1)
  } catch (error) {
    networkErrors++
    if (networkErrors === 1) {
      console.error(`first network error: ${error.message}`)
    }
  }

  durations.push(performance.now() - startedAt)
}

const worker = async () => {
  while (issued < totalRequests) {
    issued++
    pending++
    await runOne()
    pending--
  }
}

const before = await readMetrics()

console.log(
  `${totalRequests} requests against ${baseUrl}, ` +
    `${values.sequential ? 'sequential' : `${concurrency} in parallel`}, ` +
    `${(payload.length / 1024).toFixed(0)} KiB payload`
)

const progress = setInterval(() => {
  process.stderr.write(`\r  ${issued - pending}/${totalRequests} done, ${pending} in flight   `)
}, 500)

const startedAt = performance.now()
await Promise.all(Array.from({length: concurrency}, worker))
const elapsedSeconds = (performance.now() - startedAt) / 1000

clearInterval(progress)
process.stderr.write('\r\u001b[K')

const after = await readMetrics()
const sorted = [...durations].sort((a, b) => a - b)

console.log(`\nduration        ${elapsedSeconds.toFixed(1)} s`)
console.log(`throughput      ${(totalRequests / elapsedSeconds).toFixed(1)} req/s`)
console.log(`latency p50     ${percentile(sorted, 0.5).toFixed(0)} ms`)
console.log(`latency p95     ${percentile(sorted, 0.95).toFixed(0)} ms`)
console.log(`latency p99     ${percentile(sorted, 0.99).toFixed(0)} ms`)
console.log(`latency max     ${sorted.length > 0 ? sorted[sorted.length - 1].toFixed(0) : 0} ms`)

console.log('\nstatus codes')
for (const [status, count] of [...statuses.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${status}           ${count}`)
}
if (networkErrors > 0) {
  console.log(`  network err   ${networkErrors}`)
}

if (before && after) {
  console.log('\nserver')
  console.log(`  heap used     ${mib(before.heapUsed)} -> ${mib(after.heapUsed)}`)
  console.log(`  gc pauses     ${(after.gcCount - before.gcCount).toFixed(0)} collections`)
  console.log(`  gc time       ${((after.gcSeconds - before.gcSeconds) * 1000).toFixed(0)} ms`)
} else {
  console.log('\nserver metrics unavailable (is /metrics reachable?)')
}

if ((statuses.get(503) ?? 0) > 0) {
  console.log(
    '\n503 responses mean the server shed load rather than piling it up. ' +
      'Raise HYDRATE_CONCURRENCY or HYDRATE_QUEUE_WAIT_TIMEOUT if that is too eager for your setup.'
  )
}
