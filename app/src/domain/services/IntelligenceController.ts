import { aiService } from '@/lib/ai/UnifiedAIService';
import { logSystemAction } from '@/app/(app)/actions/memoryActions';

export class IntelligenceController {
    private static MAX_RETRIES = 3;
    private static TIMEOUT_MS = 15000; // 15s (Optimized for UI responsiveness per auditor feedback)

    // Circuit Breaker State
    private static state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private static failureCount = 0;
    private static lastFailureTime = 0;
    private static THRESHOLD = 5;
    private static RECOVERY_TIMEOUT = 60000; // 1 minute

    /**
     * V3: Robust AI request execution with failover and circuit breaking
     */
    static async execute(params: {
        prompt: string;
        temperature?: number;
        isPHISensitive?: boolean;
        context?: any;
    }): Promise<string> {
        // 1. Circuit Breaker Check
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.RECOVERY_TIMEOUT) {
                this.state = 'HALF_OPEN';
                console.log('[IntelligenceController] Circuit HALF_OPEN: Attempting recovery...');
            } else {
                throw new Error('CIRCUIT_OPEN: AI services temporarily suspended due to repeated failures.');
            }
        }

        const start = Date.now();
        let retryCount = 0;

        while (retryCount < this.MAX_RETRIES) {
            try {
                // 2. Exponential Backoff (if retry)
                if (retryCount > 0) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                    await new Promise(r => setTimeout(r, delay));
                }

                // 3. Attempt generation with integrated timeout
                const response = await Promise.race([
                    aiService.ask({
                        prompt: params.prompt,
                        temperature: params.temperature || 0.3,
                        isPHISensitive: params.isPHISensitive
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), this.TIMEOUT_MS)
                    )
                ]) as string;

                // 4. Reset on success
                if (this.state === 'HALF_OPEN' || this.failureCount > 0) {
                    console.log('[IntelligenceController] Success: Resetting failure counters.');
                    this.state = 'CLOSED';
                    this.failureCount = 0;
                }

                return response;

            } catch (error: any) {
                retryCount++;
                this.failureCount++;
                this.lastFailureTime = Date.now();

                console.warn(`[IntelligenceController] Attempt ${retryCount} failed: ${error.message} (Total Failures: ${this.failureCount})`);

                // 5. Trip Circuit if threshold met
                if (this.failureCount >= this.THRESHOLD) {
                    this.state = 'OPEN';
                    console.error('[IntelligenceController] CIRCUIT_OPEN: Critical failure threshold reached.');
                }

                if (error.message === 'TIMEOUT' || error.message?.includes('ECONNREFUSED')) {
                    await this.logFailure(error, params.context);
                }

                if (retryCount >= this.MAX_RETRIES) {
                    throw new Error(`Enterprise AI Failover Exhausted: ${error.message}`);
                }
            }
        }

        throw new Error('Intelligence Flow Interrupted');
    }

    private static async logFailure(error: any, context: any) {
        await logSystemAction({
            action_type: 'Correction',
            description: `AI Failover Triggered: ${error.message}`,
            metadata: {
                error: error.stack,
                context,
                timestamp: new Date().toISOString()
            }
        });
    }
}
