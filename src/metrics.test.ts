import {describe, it, expect} from 'vitest'
import {createMetrics, METRICS_CONTENT_TYPE, REJECTION_REASONS, RENDER_RESULTS} from './metrics'

const build = (activeRenders = 0, queueDepth = 0) =>
  createMetrics({activeRenders: () => activeRenders, queueDepth: () => queueDepth})

const lineFor = (output: string, prefix: string) =>
  output.split('\n').find(line => line.startsWith(prefix) && !line.startsWith('#'))

describe('createMetrics', () => {
  it('exposes the Prometheus text format content type', () => {
    expect(METRICS_CONTENT_TYPE).toContain('text/plain')
  })

  it('pre-registers every known label value at zero', () => {
    const metrics = build()
    const output = metrics.render()

    for (const result of RENDER_RESULTS) {
      expect(output).toContain(`hydrate_renders_total{result="${result}"} 0`)
    }

    for (const reason of REJECTION_REASONS) {
      expect(output).toContain(`hydrate_requests_rejected_total{reason="${reason}"} 0`)
    }

    metrics.close()
  })

  it('emits HELP and TYPE metadata for every metric', () => {
    const metrics = build()
    const output = metrics.render()

    expect(output).toContain('# TYPE hydrate_renders_active gauge')
    expect(output).toContain('# TYPE hydrate_renders_total counter')
    expect(output).toContain('# TYPE hydrate_render_duration_seconds histogram')
    expect(output).toContain('# HELP nodejs_gc_duration_seconds Garbage collection pause durations.')

    metrics.close()
  })

  it('counts render outcomes and rejections', () => {
    const metrics = build()

    metrics.countRender('ok')
    metrics.countRender('ok')
    metrics.countRender('hydration_error')
    metrics.countRejected('queue_full')

    const output = metrics.render()

    expect(output).toContain('hydrate_renders_total{result="ok"} 2')
    expect(output).toContain('hydrate_renders_total{result="hydration_error"} 1')
    expect(output).toContain('hydrate_renders_total{result="error"} 0')
    expect(output).toContain('hydrate_requests_rejected_total{reason="queue_full"} 1')

    metrics.close()
  })

  it('reads the gauges from the live sources on every scrape', () => {
    let active = 0
    const metrics = createMetrics({activeRenders: () => active, queueDepth: () => 7})

    expect(lineFor(metrics.render(), 'hydrate_renders_active')).toBe('hydrate_renders_active 0')

    active = 3

    expect(lineFor(metrics.render(), 'hydrate_renders_active')).toBe('hydrate_renders_active 3')
    expect(lineFor(metrics.render(), 'hydrate_queue_depth')).toBe('hydrate_queue_depth 7')

    metrics.close()
  })

  it('accumulates histogram buckets so that each bucket includes the smaller ones', () => {
    const metrics = build()

    metrics.observeRenderDuration(0.02)
    metrics.observeRenderDuration(0.2)
    metrics.observeRenderDuration(30)

    const output = metrics.render()

    expect(output).toContain('hydrate_render_duration_seconds_bucket{le="0.01"} 0')
    expect(output).toContain('hydrate_render_duration_seconds_bucket{le="0.025"} 1')
    expect(output).toContain('hydrate_render_duration_seconds_bucket{le="0.25"} 2')
    expect(output).toContain('hydrate_render_duration_seconds_bucket{le="10"} 2')
    expect(output).toContain('hydrate_render_duration_seconds_bucket{le="+Inf"} 3')
    expect(output).toContain('hydrate_render_duration_seconds_count 3')
    expect(output).toContain('hydrate_render_duration_seconds_sum 30.22')

    metrics.close()
  })

  it('records queue waits separately from render durations', () => {
    const metrics = build()

    metrics.observeQueueWait(0.4)

    const output = metrics.render()

    expect(output).toContain('hydrate_queue_wait_seconds_count 1')
    expect(output).toContain('hydrate_render_duration_seconds_count 0')

    metrics.close()
  })

  it('ends the exposition with a newline as scrapers expect', () => {
    const metrics = build()

    expect(metrics.render().endsWith('\n')).toBe(true)

    metrics.close()
  })

  it('collects garbage collection pauses', async () => {
    const metrics = build()

    ;(globalThis as {gc?: () => void}).gc?.()

    // The performance observer delivers entries on a later turn of the event loop.
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(metrics.render()).toContain('nodejs_gc_duration_seconds_count')

    metrics.close()
  })

  it('can be closed more than once', () => {
    const metrics = build()

    metrics.close()

    expect(() => metrics.close()).not.toThrow()
  })
})
