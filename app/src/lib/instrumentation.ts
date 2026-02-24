import { registerOTel } from '@vercel/otel';

export function register() {
    registerOTel({
        serviceName: 'intake-clinical-node',
        // The OTel collector is running as a sidecar in our docker-compose
        // Default OTLP endpoint is localhost:4318 (HTTP) inside the bridge network
        // But since Next.js runs in 'app' container, it should point to 'otel-collector:4318'
    });
}
