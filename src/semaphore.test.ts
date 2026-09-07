import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {createSemaphore, QueueRejectedError, type RejectionReason} from './semaphore'

const rejectionReason = async (promise: Promise<unknown>): Promise<RejectionReason> => {
  try {
    await promise
  } catch (error) {
    if (error instanceof QueueRejectedError) {
      return error.reason
    }
    throw error
  }
  throw new Error('expected the promise to reject')
}

describe('createSemaphore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('grants a free slot immediately without any wait', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 1000})

    const slot = await semaphore.acquire()

    expect(slot.waitMs).toBe(0)
    expect(semaphore.active).toBe(1)
    expect(semaphore.queued).toBe(0)
  })

  it('makes the next waiter wait until a slot is released', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 1000})

    const first = await semaphore.acquire()
    const secondPromise = semaphore.acquire()

    expect(semaphore.queued).toBe(1)

    await vi.advanceTimersByTimeAsync(200)
    first.release()

    const second = await secondPromise

    expect(second.waitMs).toBe(200)
    expect(semaphore.active).toBe(1)
    expect(semaphore.queued).toBe(0)
  })

  it('never exceeds maxConcurrency, even with far more work than slots', async () => {
    const semaphore = createSemaphore({maxConcurrency: 2, maxQueue: 100, queueWaitTimeout: 60_000})

    let active = 0
    let peak = 0

    const work = Array.from({length: 30}, async () => {
      const slot = await semaphore.acquire()
      active++
      peak = Math.max(peak, active)
      await Promise.resolve()
      active--
      slot.release()
    })

    await Promise.all(work)

    expect(peak).toBe(2)
    expect(semaphore.active).toBe(0)
  })

  it('rejects with queue_full once the queue is at capacity', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 1, queueWaitTimeout: 60_000})

    await semaphore.acquire()
    const queued = semaphore.acquire()

    expect(await rejectionReason(semaphore.acquire())).toBe('queue_full')
    expect(semaphore.queued).toBe(1)

    queued.catch(() => undefined)
  })

  it('rejects immediately when the queue length is zero', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 0, queueWaitTimeout: 60_000})

    await semaphore.acquire()

    expect(await rejectionReason(semaphore.acquire())).toBe('queue_full')
  })

  it('rejects with queue_timeout after the wait budget is used up', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 1000})

    await semaphore.acquire()
    const queued = semaphore.acquire()
    queued.catch(() => undefined)

    await vi.advanceTimersByTimeAsync(999)
    expect(semaphore.queued).toBe(1)

    await vi.advanceTimersByTimeAsync(1)

    expect(await rejectionReason(queued)).toBe('queue_timeout')
    expect(semaphore.queued).toBe(0)
  })

  it('rejects with aborted when the caller goes away while queued', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 60_000})
    const controller = new AbortController()

    await semaphore.acquire()
    const queued = semaphore.acquire(controller.signal)

    expect(semaphore.queued).toBe(1)
    controller.abort()

    expect(await rejectionReason(queued)).toBe('aborted')
    expect(semaphore.queued).toBe(0)
  })

  it('rejects with aborted without queueing when the signal is already aborted', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 60_000})

    expect(await rejectionReason(semaphore.acquire(AbortSignal.abort()))).toBe('aborted')
    expect(semaphore.active).toBe(0)
  })

  it('hands an abandoned slot to the next waiter instead of losing it', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 60_000})
    const controller = new AbortController()

    const first = await semaphore.acquire()
    const abandoned = semaphore.acquire(controller.signal)
    const next = semaphore.acquire()

    controller.abort()
    await rejectionReason(abandoned)

    first.release()

    await expect(next).resolves.toMatchObject({waitMs: 0})
    expect(semaphore.active).toBe(1)
  })

  it('ignores a slot released more than once', async () => {
    const semaphore = createSemaphore({maxConcurrency: 1, maxQueue: 4, queueWaitTimeout: 60_000})

    const slot = await semaphore.acquire()
    slot.release()
    slot.release()

    expect(semaphore.active).toBe(0)
  })
})
