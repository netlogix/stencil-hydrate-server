import {PerformanceObserver} from 'perf_hooks'

export const METRICS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8'

export const RENDER_RESULTS = ['ok', 'hydration_error', 'timeout', 'error'] as const
export type RenderResult = (typeof RENDER_RESULTS)[number]

export const REJECTION_REASONS = ['queue_full', 'queue_timeout', 'body_too_large', 'client_disconnected'] as const
export type RejectionReason = (typeof REJECTION_REASONS)[number]

const RENDER_DURATION_BUCKETS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 2.5, 3, 3.5, 5, 10]
const QUEUE_WAIT_BUCKETS = [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 2, 5]
const GC_DURATION_BUCKETS = [0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]

const escapeLabelValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

interface Collectable {
  collect: () => string[]
}

interface Counter extends Collectable {
  increment: (labelValue: string) => void
}

interface Histogram extends Collectable {
  observe: (value: number) => void
}

/**
 * A labelled counter. All known label values are pre-registered with 0 so that a missing series
 * never has to be distinguished from a series that has simply not fired yet.
 */
const createCounter = (name: string, help: string, labelName: string, labelValues: readonly string[]): Counter => {
  const values = new Map<string, number>(labelValues.map(labelValue => [labelValue, 0]))

  return {
    increment: labelValue => {
      values.set(labelValue, (values.get(labelValue) ?? 0) + 1)
    },
    collect: () => {
      const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} counter`]

      for (const [labelValue, value] of values) {
        lines.push(`${name}{${labelName}="${escapeLabelValue(labelValue)}"} ${value}`)
      }

      return lines
    }
  }
}

const createGauge = (name: string, help: string, read: () => number): Collectable => ({
  collect: () => [`# HELP ${name} ${help}`, `# TYPE ${name} gauge`, `${name} ${read()}`]
})

/**
 * A histogram with cumulative buckets, as Prometheus expects: every bucket counts all
 * observations less than or equal to its upper bound.
 */
const createHistogram = (name: string, help: string, bounds: readonly number[]): Histogram => {
  const counts = bounds.map(() => 0)
  let sum = 0
  let count = 0

  return {
    observe: value => {
      count++
      sum += value

      bounds.forEach((bound, index) => {
        if (value <= bound) {
          counts[index] = (counts[index] ?? 0) + 1
        }
      })
    },
    collect: () => {
      const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} histogram`]

      bounds.forEach((bound, index) => {
        lines.push(`${name}_bucket{le="${bound}"} ${counts[index] ?? 0}`)
      })

      lines.push(`${name}_bucket{le="+Inf"} ${count}`)
      lines.push(`${name}_sum ${sum}`)
      lines.push(`${name}_count ${count}`)

      return lines
    }
  }
}

export interface Metrics {
  countRender: (result: RenderResult) => void
  countRejected: (reason: RejectionReason) => void
  observeQueueWait: (seconds: number) => void
  observeRenderDuration: (seconds: number) => void
  /** Renders the current values in the Prometheus text exposition format. */
  render: () => string
  /** Stops background collection. Called when the server closes. */
  close: () => void
}

export interface MetricSources {
  activeRenders: () => number
  queueDepth: () => number
}

export const createMetrics = ({activeRenders, queueDepth}: MetricSources): Metrics => {
  const renders = createCounter(
    'hydrate_renders_total',
    'Total number of finished renders by outcome.',
    'result',
    RENDER_RESULTS
  )

  const rejected = createCounter(
    'hydrate_requests_rejected_total',
    'Total number of requests rejected before rendering.',
    'reason',
    REJECTION_REASONS
  )

  const renderDuration = createHistogram(
    'hydrate_render_duration_seconds',
    'Time spent inside renderToString.',
    RENDER_DURATION_BUCKETS
  )

  const queueWait = createHistogram(
    'hydrate_queue_wait_seconds',
    'Time spent waiting for a render slot.',
    QUEUE_WAIT_BUCKETS
  )

  /**
   * Garbage collection pause time. This is the leading indicator for the failure mode this
   * server guards against: once retained memory approaches the heap limit, major collections
   * start dominating the single thread long before the process actually runs out of memory.
   */
  const gcDuration = createHistogram(
    'nodejs_gc_duration_seconds',
    'Garbage collection pause durations.',
    GC_DURATION_BUCKETS
  )

  const collectables: Collectable[] = [
    createGauge('hydrate_renders_active', 'Renders currently in progress.', activeRenders),
    createGauge('hydrate_queue_depth', 'Requests currently waiting for a render slot.', queueDepth),
    renders,
    rejected,
    renderDuration,
    queueWait,
    createGauge('nodejs_heap_size_used_bytes', 'Used heap size in bytes.', () => process.memoryUsage().heapUsed),
    createGauge('nodejs_heap_size_total_bytes', 'Total heap size in bytes.', () => process.memoryUsage().heapTotal),
    gcDuration
  ]

  let observer: PerformanceObserver | undefined

  try {
    observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        gcDuration.observe(entry.duration / 1000)
      }
    })
    observer.observe({entryTypes: ['gc']})
  } catch {
    observer = undefined
  }

  return {
    countRender: result => renders.increment(result),
    countRejected: reason => rejected.increment(reason),
    observeQueueWait: seconds => queueWait.observe(seconds),
    observeRenderDuration: seconds => renderDuration.observe(seconds),
    render: () => `${collectables.flatMap(collectable => collectable.collect()).join('\n')}\n`,
    close: () => {
      observer?.disconnect()
      observer = undefined
    }
  }
}
