import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { LocalAIProvider } from './providers/LocalAIProvider';

export class UnifiedAIService {
    private primaryProvider: AIProvider;
    private fallbackProvider: AIProvider | null = null;

    constructor() {
        // SME: Strategy Pattern for AI Providers with Fallback
        const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || process.env.OLLAMA_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:11434' : '');
        const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'mistral-small';
        const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        // Initialize Primary (Ollama)
        if (ollamaUrl) {
            console.log(`[UnifiedAIService] Primary: Local AI Provider (Ollama) with model: ${ollamaModel}`);
            this.primaryProvider = new LocalAIProvider(ollamaUrl, ollamaModel);
        } else {
            // If no local AI, try to make Gemini primary
            if (geminiKey) {
                console.log('[UnifiedAIService] Primary: Gemini AI Provider (No Local AI configured)');
                this.primaryProvider = new GeminiProvider(geminiKey);
            } else {
                console.warn('AI Provider configuration missing. AI features may be disabled.');
                this.primaryProvider = {
                    name: 'null-provider',
                    generate: async () => 'AI service unavailable'
                };
            }
        }

        // Initialize Fallback (Gemini) if Primary is Ollama and we have a key
        if (this.primaryProvider.name === 'ollama' && geminiKey) {
            console.log('[UnifiedAIService] Fallback: Gemini AI Provider configured');
            this.fallbackProvider = new GeminiProvider(geminiKey);
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
