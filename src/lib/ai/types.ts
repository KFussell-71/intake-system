export interface AIRequest {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    userId: string;
}

export interface AIResponse {
    text: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export interface AIProvider {
    name: string;
    generateText(request: AIRequest): Promise<AIResponse>;
}
