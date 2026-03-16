/**
 * V3: Structured JSON Logger
 * Mimics Pino behavior for enterprise observability.
 */
export class StructuredLogger {
    static log(level: 'info' | 'warn' | 'error', message: string, context: any = {}) {
        const { correlationId, ...rest } = context;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId: correlationId || 'GLOBAL',
            ...rest
        };

        if (level === 'error') {
            console.error(JSON.stringify(entry));
        } else if (level === 'warn') {
            console.warn(JSON.stringify(entry));
        } else {
            console.log(JSON.stringify(entry));
        }
    }

    static info(msg: string, ctx?: any) { this.log('info', msg, ctx); }
    static warn(msg: string, ctx?: any) { this.log('warn', msg, ctx); }
    static error(msg: string, ctx?: any) { this.log('error', msg, ctx); }
}
