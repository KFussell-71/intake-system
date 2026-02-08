import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';

export class UnifiedAIService {
    private provider: AIProvider;

    constructor() {
        // SME: Strategy Pattern for AI Providers
        // Defaults to Gemini, can be extended for OpenAI/Claude/LocalLLM
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            this.provider = new GeminiProvider(apiKey);
        } else {
            console.warn('AI Provider configuration missing (GEMINI_API_KEY). AI features may be disabled.');
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
