import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse } from '../types';

export class GeminiProvider implements AIProvider {
    readonly name = 'gemini';
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generate(req: AIRequest): Promise<string> {
        const modelName = 'gemini-1.5-pro';
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: req.temperature ?? 0.3,
                maxOutputTokens: 1024
            }
        });

        const result = await model.generateContent(req.prompt);
        const response = await result.response;
        return response.text();
    }
}
