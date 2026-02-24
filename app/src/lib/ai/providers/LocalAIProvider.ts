import { AIProvider, AIRequest, AIResponse } from '../types';

enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

export class LocalAIProvider implements AIProvider {
    readonly name = 'ollama';
    private baseUrl: string;
    private model: string;
    private fallbackProvider?: AIProvider;

    // Circuit Breaker State
    private state: CircuitState = CircuitState.CLOSED;
    private failures = 0;
    private lastFailureTime = 0;
    private readonly failureThreshold = 3;
    private readonly cooldownPeriod = 30000; // 30 seconds

    constructor(
        baseUrl: string = 'http://localhost:11434',
        model: string = 'mistral',
        fallbackProvider?: AIProvider
    ) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.fallbackProvider = fallbackProvider;
    }

    async generate(req: AIRequest): Promise<string> {
        this.updateState();

        if (this.state === CircuitState.OPEN) {
            if (!req.isPHISensitive && this.fallbackProvider) {
                console.warn(`[LocalAIProvider] Circuit is OPEN. Falling back to ${this.fallbackProvider.name}...`);
                return this.fallbackProvider.generate(req);
            }
            throw new Error('Local AI circuit is OPEN and no non-PHI fallback available');
        }

        try {
            const result = await this.executeGenerate(req);
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();

            // Explicitly re-check if circuit was tripped during this failure
            const isTripped = this.state as CircuitState === CircuitState.OPEN;
            if (isTripped && !req.isPHISensitive && this.fallbackProvider) {
                console.warn(`[LocalAIProvider] Circuit TRIPPED. Falling back to ${this.fallbackProvider.name}...`);
                return this.fallbackProvider.generate(req);
            }
            throw error;
        }
    }

    private updateState() {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime > this.cooldownPeriod) {
                console.log('[LocalAIProvider] Cooldown elapsed. Moving to HALF_OPEN.');
                this.state = CircuitState.HALF_OPEN;
            }
        }
    }

    private onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            console.log('[LocalAIProvider] Trial success! Closing circuit.');
        }
        this.state = CircuitState.CLOSED;
        this.failures = 0;
    }

    private onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
            console.error(`[LocalAIProvider] Failure threshold reached. TRIPPING CIRCUIT.`);
            this.state = CircuitState.OPEN;
        }
    }

    private async executeGenerate(req: AIRequest): Promise<string> {
        try {
            const res = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `${req.system ? req.system + '\n' : ''}${req.prompt}`,
                    stream: false,
                    options: {
                        temperature: req.temperature ?? 0.3,
                        num_predict: 1024
                    }
                })
            });

            if (res.status === 404) {
                console.warn(`[LocalAIProvider] Model ${this.model} not found. Attempting auto-pull...`);
                await this.pullModel();
                return this.executeGenerate(req);
            }

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

    private async pullModel(): Promise<void> {
        const res = await fetch(`${this.baseUrl}/api/pull`, {
            method: 'POST',
            body: JSON.stringify({ name: this.model, stream: false })
        });
        if (!res.ok) throw new Error(`Failed to pull model ${this.model}`);
    }
}
