import { AIProvider, AIRequest, AIResponse } from '../types';

export class LocalAIProvider implements AIProvider {
    readonly name = 'ollama';
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11434', model: string = 'mistral-small') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async generateText(request: AIRequest): Promise<AIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: request.prompt,
                    stream: false,
                    options: {
                        temperature: request.temperature ?? 0.3,
                        num_predict: request.maxTokens ?? 1024
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                text: data.response,
                model: this.model,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0
                }
            };
        } catch (error) {
            console.error('[LocalAIProvider] Generation failed:', error);
            throw error;
        }
    }
}
