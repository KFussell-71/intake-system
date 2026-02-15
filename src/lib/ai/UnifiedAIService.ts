import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { LocalAIProvider } from './providers/LocalAIProvider';
import { MockAIProvider } from './providers/MockAIProvider';

export class UnifiedAIService {
    private primaryProvider: AIProvider;
    private fallbackProvider: AIProvider | null = null;

    constructor() {
        // SME: Strategy Pattern for AI Providers with Fallback
        // PRIMARY: Ollama (Local Privacy-First)
        // FALLBACK: Gemini (Cloud High-Performance)

        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'llama3'; // Default to a standard model
        const googleApiKey = process.env.GOOGLE_API_KEY;

        // Initialize Primary (Ollama)
        this.primaryProvider = new LocalAIProvider(ollamaBaseUrl, ollamaModel);

        // Initialize Fallback (Gemini)
        if (googleApiKey) {
            this.fallbackProvider = new GeminiProvider(googleApiKey);
        } else {
            console.warn('[UnifiedAIService] GOOGLE_API_KEY not set. Gemini fallback disabled.');
            // If no fallback key, we could potentially use Mock as a last resort or just leave it null.
            // For now, let's keep it null implementation-wise to error out if Ollama fails, 
            // OR use Mock if we want to guarantee *some* response.
            // Let's use MockAIProvider as a "Safety Net" for dev environments without Keys.
            if (process.env.NODE_ENV === 'development') {
                this.fallbackProvider = new MockAIProvider();
            }
        }
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
