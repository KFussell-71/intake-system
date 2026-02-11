import { AIProvider, AIRequest, AIResponse } from '../types';

export class LocalAIProvider implements AIProvider {
    readonly name = 'ollama';
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11434', model: string = 'mistral-small') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async generate(req: AIRequest): Promise<string> {
        try {
            const res = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `${req.system ? req.system + '\n' : ''}${req.prompt}`,
                    stream: false,
                    options: {
                        temperature: req.temperature ?? 0.3,
                        num_predict: 1024 // Keep a reasonable default
                    }
                })
            });

            if (!res.ok) {
                throw new Error(`Ollama API error: ${res.statusText}`);
            }

            const data = await res.json();
            return data.response;

        } catch (error) {
            console.error('[LocalAIProvider] Generation failed:', error);
            throw error;
        }
    }
}
