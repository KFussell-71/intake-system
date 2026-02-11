import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { LocalAIProvider } from './providers/LocalAIProvider';

export class UnifiedAIService {
    private provider: AIProvider;

    constructor() {
        // SME: Strategy Pattern for AI Providers
        // Prefer Local Provider (Ollama) if OLLAMA_BASE_URL is set, else Gemini
        const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || process.env.OLLAMA_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:11434' : '');
        const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'mistral-small';
        const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (ollamaUrl) {
            console.log(`[UnifiedAIService] Using Local AI Provider (Ollama) with model: ${ollamaModel}`);
            this.provider = new LocalAIProvider(ollamaUrl, ollamaModel);
        } else if (geminiKey) {
            console.log('[UnifiedAIService] Using Gemini AI Provider');
            this.provider = new GeminiProvider(geminiKey);
        } else {
            console.warn('AI Provider configuration missing (GEMINI_API_KEY or OLLAMA_URL). AI features may be disabled.');
            this.provider = {
                name: 'null-provider',
                generateText: async () => ({ text: 'AI service unavailable', model: 'none' })
            };
        }
    }

    async generateText(request: AIRequest): Promise<AIResponse> {
        return this.provider.generateText(request);
    }
}

export const aiService = new UnifiedAIService();
export default aiService;
