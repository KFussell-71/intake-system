import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Initial check to avoid double-registration
let isInitialized = false;

export function initMetrics() {
    if (isInitialized) return;

    collectDefaultMetrics({ prefix: 'vanguard_intake_' });
    isInitialized = true;
}

// AI Specific Metrics
export const aiRequestsTotal = new Counter({
    name: 'vanguard_ai_requests_total',
    help: 'Total number of AI clinical narrative requests',
    labelNames: ['status', 'provider']
});

export const aiInferenceDuration = new Histogram({
    name: 'vanguard_ai_inference_duration_seconds',
    help: 'Duration of AI inference in seconds',
    labelNames: ['provider'],
    buckets: [1, 5, 10, 30, 60, 120]
});

export const registry = register;
