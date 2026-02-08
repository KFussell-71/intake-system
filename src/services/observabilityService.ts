/**
 * SME: Observability & Performance Tracing
 * Lightweight abstraction for OpenTelemetry-compatible tracing.
 */

interface TraceAttributes {
    [key: string]: string | number | boolean | undefined;
}

export class ObservabilityService {
    private static instance: ObservabilityService;
    private isClient: boolean;

    private constructor() {
        this.isClient = typeof window !== 'undefined';
    }

    static getInstance(): ObservabilityService {
        if (!ObservabilityService.instance) {
            ObservabilityService.instance = new ObservabilityService();
        }
        return ObservabilityService.instance;
    }

    /**
     * Start a measurement span for a specific operation.
     */
    startSpan(name: string, attributes: TraceAttributes = {}) {
        const startTime = Date.now();
        console.log(`[OTel:Trace] Starting span: ${name}`, attributes);

        return {
            end: () => {
                const duration = Date.now() - startTime;
                console.log(`[OTel:Trace] Ending span: ${name}, duration: ${duration}ms`);

                // Track as metric
                this.trackMetric(`duration_${name}`, duration, attributes);
            },
            recordError: (error: Error) => {
                console.error(`[OTel:Trace] Error in span: ${name}`, error);
                this.trackMetric(`error_${name}`, 1, { ...attributes, error: error.message });
            }
        };
    }

    /**
     * Track a custom metric (Counter, Histogram, etc.)
     */
    trackMetric(name: string, value: number, attributes: TraceAttributes = {}) {
        // In a real OpenTelemetry setup, this would use @opentelemetry/api
        // For now, we log it and can easily wire to any collector.
        const metric = {
            name,
            value,
            attributes,
            timestamp: Date.now(),
            service: 'intake-system'
        };

        if (this.isClient) {
            // Potential: Send to telemetry endpoint
            // fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(metric) });
        } else {
            // Server-side logging
            console.log(`[OTel:Metric] ${JSON.stringify(metric)}`);
        }
    }
}

export const obs = ObservabilityService.getInstance();
