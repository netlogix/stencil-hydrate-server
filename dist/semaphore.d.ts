export type RejectionReason = 'queue_full' | 'queue_timeout' | 'aborted';
export declare class QueueRejectedError extends Error {
    readonly reason: RejectionReason;
    constructor(reason: RejectionReason);
}
export interface RenderSlot {
    /** Milliseconds this request spent waiting for the slot. */
    waitMs: number;
    /** Releases the slot. Safe to call more than once. */
    release: () => void;
}
export interface Semaphore {
    /**
     * Acquires a render slot, waiting in the queue if all slots are busy.
     *
     * Rejects with a {@link QueueRejectedError} when the queue is full, when the wait exceeds
     * `queueWaitTimeout`, or when `signal` is aborted while waiting.
     */
    acquire: (signal?: AbortSignal) => Promise<RenderSlot>;
    readonly active: number;
    readonly queued: number;
}
export interface SemaphoreOptions {
    maxConcurrency: number;
    maxQueue: number;
    queueWaitTimeout: number;
}
/**
 * Limits how many renders run at the same time.
 *
 * Stencil's hydrate app re-evaluates the entire bundle for every `renderToString` call, so each
 * concurrent render holds a full copy of the app plus its parsed document. Since the rendering
 * itself is single threaded, running renders in parallel does not increase throughput of the CPU
 * bound part, it only multiplies the peak memory. Serialising them keeps the footprint flat.
 */
export declare const createSemaphore: ({ maxConcurrency, maxQueue, queueWaitTimeout }: SemaphoreOptions) => Semaphore;
