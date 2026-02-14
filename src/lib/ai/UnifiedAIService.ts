import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { LocalAIProvider } from './providers/LocalAIProvider';
import { MockAIProvider } from './providers/MockAIProvider';

export class UnifiedAIService {
    private primaryProvider: AIProvider;
    private fallbackProvider: AIProvider | null = null;

    constructor() {
        // SME: Strategy Pattern for AI Providers with Fallback

        // FORCE MOCK FOR DEMO/LOW-RESOURCE
        console.log('[UnifiedAIService] Forcing MockAIProvider for resource optimization.');
        this.primaryProvider = new MockAIProvider();
        this.fallbackProvider = null;
    }
    async ask(req: AIRequest): Promise<string> {
        const start = Date.now();

        try {
            // Attempt Primary
            return await this.executeRequest(this.primaryProvider, req, start);
        } catch (error) {
            // Attempt Fallback
            if (this.fallbackProvider) {
                console.warn(`[UnifiedAIService] Primary provider (${this.primaryProvider.name}) failed. Switching to fallback (${this.fallbackProvider.name}).`, error);

                try {
                    return await this.executeRequest(this.fallbackProvider, req, start);
                } catch (fallbackError) {
                    console.error(`[UnifiedAIService] Fallback provider (${this.fallbackProvider.name}) also failed.`, fallbackError);
                    throw fallbackError; // Rethrow to let caller handle (e.g., mock report)
                }
            }

            // No fallback available
            console.error('[AI_FAILURE]', { provider: this.primaryProvider.name, error });
            throw error;
        }
    }

    private async executeRequest(provider: AIProvider, req: AIRequest, startTime: number): Promise<string> {
        const response = await provider.generate(req);
        const duration = Date.now() - startTime;

        console.log('[AI_USAGE]', {
            provider: provider.name,
            promptLength: req.prompt.length,
            responseLength: response.length,
            latencyMs: duration,
            temperature: req.temperature
        });

        return response;
    }
}

export const aiService = new UnifiedAIService();
export default aiService;
