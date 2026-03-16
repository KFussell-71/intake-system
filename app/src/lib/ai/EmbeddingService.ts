import { prisma } from '@/lib/auth/authHelpersServer';

export interface EmbeddingResponse {
    embedding: number[];
}

export class EmbeddingService {
    private baseUrl: string;
    private model: string;

    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        // SME: mxbai-embed-large is superior for clinical RAG retrieval (768 dims)
        this.model = process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large';
    }

    /**
     * Generates a semantic vector for a given text input.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const res = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: text
                })
            });

            if (res.status === 404) {
                console.warn(`[EmbeddingService] Model ${this.model} not found. Attempting auto-pull...`);
                await this.pullModel();
                return this.generateEmbedding(text);
            }

            if (!res.ok) {
                throw new Error(`Ollama Embedding error: ${res.statusText}`);
            }

            const data = await res.json();
            return data.embedding;
        } catch (error) {
            console.error('[EmbeddingService] Failed to generate embedding:', error);
            throw error;
        }
    }

    /**
     * Performs a semantic search against the clinical_memory table using Prisma and pgvector.
     */
    async searchClinicalMemory(query: string, limit: number = 5): Promise<any[]> {
        const vector = await this.generateEmbedding(query);
        const vectorStr = `[${vector.join(',')}]`;

        try {
            // SME: Using cosine similarity via pgvector operator <=> directly through Prisma's raw query
            const data: any[] = await prisma.$queryRawUnsafe(`
                SELECT id, content, metadata, 1 - (embedding <=> $1::vector) AS similarity
                FROM clinical_memory
                WHERE 1 - (embedding <=> $1::vector) > $2
                ORDER BY similarity DESC
                LIMIT $3
            `, vectorStr, 0.5, limit);
            
            return data || [];
        } catch (error) {
            console.error('[EmbeddingService] Search failed:', error);
            throw error;
        }
    }

    private async pullModel(): Promise<void> {
        console.log(`[EmbeddingService] Pulling model ${this.model}...`);
        const res = await fetch(`${this.baseUrl}/api/pull`, {
            method: 'POST',
            body: JSON.stringify({ name: this.model, stream: false })
        });
        if (!res.ok) throw new Error(`Failed to pull model ${this.model}`);
    }
}
