export declare const METRICS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";
export declare const RENDER_RESULTS: readonly ['ok', 'hydration_error', 'timeout', 'error'];
export type RenderResult = (typeof RENDER_RESULTS)[number];
export declare const REJECTION_REASONS: readonly ['queue_full', 'queue_timeout', 'body_too_large', 'bad_request', 'client_disconnected'];
export type RejectionReason = (typeof REJECTION_REASONS)[number];
export interface Metrics {
    countRender: (result: RenderResult) => void;
    countRejected: (reason: RejectionReason) => void;
    observeQueueWait: (seconds: number) => void;
    observeRenderDuration: (seconds: number) => void;
    /** Renders the current values in the Prometheus text exposition format. */
    render: () => string;
    /** Stops background collection. Called when the server closes. */
    close: () => void;
}
export interface MetricSources {
    activeRenders: () => number;
    queueDepth: () => number;
}
export declare const createMetrics: ({ activeRenders, queueDepth }: MetricSources) => Metrics;
