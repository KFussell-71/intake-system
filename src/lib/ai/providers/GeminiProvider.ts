import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse } from '../types';

export class GeminiProvider implements AIProvider {
    readonly name = 'gemini';
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateText(request: AIRequest): Promise<AIResponse> {
        const modelName = 'gemini-1.5-pro';
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: request.temperature ?? 0.3,
                maxOutputTokens: request.maxTokens
            }
        });

        const result = await model.generateContent(request.prompt);
        const response = await result.response;
        const text = response.text();

        return {
            text,
            model: modelName
        };
    }
}
