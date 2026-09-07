export type RejectionReason = 'queue_full' | 'queue_timeout' | 'aborted'

export class QueueRejectedError extends Error {
  readonly reason: RejectionReason

  constructor(reason: RejectionReason) {
    super(`render slot not acquired: ${reason}`)
    this.name = 'QueueRejectedError'
    this.reason = reason
  }
}

export interface RenderSlot {
  /** Milliseconds this request spent waiting for the slot. */
  waitMs: number
  /** Releases the slot. Safe to call more than once. */
  release: () => void
}

export interface Semaphore {
  /**
   * Acquires a render slot, waiting in the queue if all slots are busy.
   *
   * Rejects with a {@link QueueRejectedError} when the queue is full, when the wait exceeds
   * `queueWaitTimeout`, or when `signal` is aborted while waiting.
   */
  acquire: (signal?: AbortSignal) => Promise<RenderSlot>
  readonly active: number
  readonly queued: number
}

export interface SemaphoreOptions {
  maxConcurrency: number
  maxQueue: number
  queueWaitTimeout: number
}

interface Waiter {
  grant: () => void
}

/**
 * Limits how many renders run at the same time.
 *
 * Stencil's hydrate app re-evaluates the entire bundle for every `renderToString` call, so each
 * concurrent render holds a full copy of the app plus its parsed document. Since the rendering
 * itself is single threaded, running renders in parallel does not increase throughput of the CPU
 * bound part, it only multiplies the peak memory. Serialising them keeps the footprint flat.
 */
export const createSemaphore = ({maxConcurrency, maxQueue, queueWaitTimeout}: SemaphoreOptions): Semaphore => {
  let active = 0
  const waiting: Waiter[] = []

  const createSlot = (waitMs: number): RenderSlot => {
    let released = false

    return {
      waitMs,
      release: () => {
        if (released) {
          return
        }
        released = true
        active--
        dispatch()
      }
    }
  }

  const dispatch = () => {
    while (active < maxConcurrency && waiting.length > 0) {
      const waiter = waiting.shift()
      if (waiter) {
        waiter.grant()
      }
    }
  }

  const acquire = (signal?: AbortSignal): Promise<RenderSlot> => {
    if (signal?.aborted) {
      return Promise.reject(new QueueRejectedError('aborted'))
    }

    if (active < maxConcurrency) {
      active++
      return Promise.resolve(createSlot(0))
    }

    if (waiting.length >= maxQueue) {
      return Promise.reject(new QueueRejectedError('queue_full'))
    }

    const startedAt = Date.now()

    return new Promise<RenderSlot>((resolve, reject) => {
      let settled = false

      const remove = () => {
        const index = waiting.indexOf(waiter)
        if (index >= 0) {
          waiting.splice(index, 1)
        }
      }

      const cleanup = () => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }

      const fail = (reason: RejectionReason) => {
        if (settled) {
          return
        }
        settled = true
        remove()
        cleanup()
        reject(new QueueRejectedError(reason))
      }

      const onAbort = () => fail('aborted')

      const timer = setTimeout(() => fail('queue_timeout'), queueWaitTimeout)

      if (typeof timer.unref === 'function') {
        timer.unref()
      }

      signal?.addEventListener('abort', onAbort, {once: true})

      const waiter: Waiter = {
        grant: () => {
          if (settled) {
            return
          }
          settled = true
          cleanup()
          active++
          resolve(createSlot(Date.now() - startedAt))
        }
      }

      waiting.push(waiter)
    })
  }

  return {
    acquire,
    get active() {
      return active
    },
    get queued() {
      return waiting.length
    }
  }
}
