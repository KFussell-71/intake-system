import { AIProvider, AIRequest, AIResponse } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { LocalAIProvider } from './providers/LocalAIProvider';
import { MockAIProvider } from './providers/MockAIProvider';
import { EmbeddingService } from './EmbeddingService';
import { aiRequestsTotal, aiInferenceDuration } from '@/lib/observability/metrics';

export class UnifiedAIService {
    private primaryProvider: AIProvider;
    private fallbackProvider: AIProvider | null = null;
    private embeddingService: EmbeddingService;

    constructor() {
        // SME: Strategy Pattern for AI Providers with Fallback
        // PRIMARY: Ollama (Local Privacy-First)
        // FALLBACK: Gemini (Cloud High-Performance)

        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'mistral';
        const googleApiKey = process.env.GOOGLE_API_KEY;

        console.log(`[UnifiedAIService] Initializing with Primary: Ollama (${ollamaModel})`);

        // Initialize Primary (Ollama)
        this.primaryProvider = new LocalAIProvider(ollamaBaseUrl, ollamaModel);

        // Initialize Fallback (Gemini)
        if (googleApiKey) {
            console.log('[UnifiedAIService] Gemini fallback enabled');
            this.fallbackProvider = new GeminiProvider(googleApiKey);
        } else {
            console.warn('[UnifiedAIService] GOOGLE_API_KEY not set. Gemini fallback disabled.');
            // Allow Mock as safety valve in dev only
            if (process.env.NODE_ENV === 'development') {
                this.fallbackProvider = new MockAIProvider();
            }
        }

        // Initialize Local Embedding Engine
        this.embeddingService = new EmbeddingService();
    }
    async ask(req: AIRequest): Promise<string> {
        const start = Date.now();

        try {
            // Attempt Primary
            const result = await this.executeRequest(this.primaryProvider, req, start);
            aiRequestsTotal.inc({ status: 'success', provider: this.primaryProvider.name });
            return result;
        } catch (error) {
            aiRequestsTotal.inc({ status: 'error', provider: this.primaryProvider.name });

            // SME: PHI Safety Gate. If data is sensitive, we STOP here rather than risking cloud leakage.
            if (req.isPHISensitive) {
                console.error('[UnifiedAIService] Primary (Local) AI failed for PHI-sensitive request. Blocking Cloud fallback to ensure HIPAA compliance.');
                throw new Error('Local AI Service Unavailable. PHI-sensitive tasks blocked to prevent cloud data leakage.');
            }

            // Attempt Fallback for non-sensitive data
            if (this.fallbackProvider) {
                console.warn(`[UnifiedAIService] Primary provider (${this.primaryProvider.name}) failed. Switching to fallback (${this.fallbackProvider.name}).`, error);

                try {
                    const fallbackResult = await this.executeRequest(this.fallbackProvider, req, start);
                    aiRequestsTotal.inc({ status: 'success', provider: this.fallbackProvider.name });
                    return fallbackResult;
                } catch (fallbackError) {
                    aiRequestsTotal.inc({ status: 'error', provider: this.fallbackProvider.name });
                    console.error(`[UnifiedAIService] Fallback provider (${this.fallbackProvider.name}) also failed.`, fallbackError);
                    throw fallbackError;
                }
            }

            // No fallback available
            console.error('[AI_FAILURE]', { provider: this.primaryProvider.name, error });
            throw error;
        }
    }

    private async executeRequest(provider: AIProvider, req: AIRequest, startTime: number): Promise<string> {
        const response = await provider.generate(req);
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds

        aiInferenceDuration.observe({ provider: provider.name }, duration);

        console.log('[AI_USAGE]', {
            provider: provider.name,
            promptLength: req.prompt.length,
            responseLength: response.length,
            latencyMs: duration,
            temperature: req.temperature
        });

        return response;
    }

    /**
     * SME: Edge-RAG Retrieval
     * Fetches semantically relevant clinical guidelines or laws from the local NAS.
     */
    async retrieveClinicalContext(query: string, limit: number = 3): Promise<string> {
        try {
            const results = await this.embeddingService.searchClinicalMemory(query, limit);
            if (results.length === 0) return '';

            return results
                .map(r => `[CONTEXT: ${r.metadata?.citation || 'General'}] ${r.content}`)
                .join('\n\n');
        } catch (error) {
            console.warn('[UnifiedAIService] Context retrieval failed, proceeding without RAG.', error);
            return '';
        }
    }
}

export const aiService = new UnifiedAIService();
export default aiService;
