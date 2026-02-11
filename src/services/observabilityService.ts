import { supabase } from '@/lib/supabase';

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
                this.trackMetric(`duration_${name}`, duration, attributes, 'metric');
            },
            recordError: (error: Error) => {
                console.error(`[OTel:Trace] Error in span: ${name}`, error);
                this.trackMetric(`error_${name}`, 1, { ...attributes, error: error.message }, 'error');
            }
        };
    }

    /**
     * SME: HIPAA Compliance Masking
     * Prevents PII/PHI from leaking into telemetry logs.
     */
    private sanitizeAttributes(attributes: TraceAttributes): TraceAttributes {
        const sanitized: TraceAttributes = {};
        const SENSITIVE_KEYS = ['ssn', 'phone', 'email', 'name', 'rationale', 'summary', 'address'];
        const SSN_REGEX = /\d{3}-\d{2}-\d{4}/g;

        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined) continue;

            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
                sanitized[key] = '[MASKED]';
            } else if (typeof value === 'string') {
                sanitized[key] = value.replace(SSN_REGEX, '[SSN_MASKED]');
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    /**
     * Track a custom metric, span, or error
     */
    async trackMetric(
        name: string,
        value: number,
        attributes: TraceAttributes = {},
        type: 'metric' | 'span' | 'error' = 'metric'
    ) {
        const sanitizedAttributes = this.sanitizeAttributes(attributes);
        const payload = {
            event_name: name,
            event_type: type,
            value,
            attributes: sanitizedAttributes,
            created_at: new Date().toISOString()
        };

        // 1. Console logging for dev visibility
        if (type === 'error') {
            console.error(`[OTel:${type.toUpperCase()}] ${name}:`, payload);
        } else {
            console.log(`[OTel:${type.toUpperCase()}] ${name}:`, value, sanitizedAttributes);
        }

        // 2. Persistent storage in Supabase (Shadow recording)
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // SECURITY: Fire-and-forget, but sanitized
                supabase.from('telemetry_logs').insert({
                    ...payload,
                    created_by: user.id
                }).then(({ error }) => {
                    if (error) console.error('[Observability] Persistence Error:', error);
                });
            }
        } catch (err) {
            console.warn('[Observability] Telemetry persistence skipped:', err);
        }
    }
}

export const obs = ObservabilityService.getInstance();
