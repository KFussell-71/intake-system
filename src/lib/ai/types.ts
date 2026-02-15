
export interface AIRequest {
    system?: string;
    prompt: string;
    temperature?: number;
    // Keeping optional metadata for telemetry if needed, but strict to user core request
    userId?: string;
    format?: 'json' | 'text';
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
    generate(req: AIRequest): Promise<string>;
}
