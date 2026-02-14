
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedAIService } from './UnifiedAIService';
import { AIProvider } from './types';

// Mock Providers classes
class MockOllama implements AIProvider {
    name = 'ollama';
    async generate(): Promise<string> {
        throw new Error('Ollama Connection Refused');
    }
}

class MockGemini implements AIProvider {
    name = 'gemini';
    async generate(): Promise<string> {
        return 'GEMINI_SUCCESS_RESPONSE';
    }
}

describe('UnifiedAIService Fallback', () => {
    let service: UnifiedAIService;

    beforeEach(() => {
        service = new UnifiedAIService();
        // @ts-ignore - Inject mocks directly
        service.primaryProvider = new MockOllama();
        // @ts-ignore - Inject mocks directly
        service.fallbackProvider = new MockGemini();
    });

    it('should fall back to Gemini when primary provider fails', async () => {
        const response = await service.ask({ prompt: 'test' });
        expect(response).toBe('GEMINI_SUCCESS_RESPONSE');
    });

    it('should log warning when switching providers', async () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        await service.ask({ prompt: 'test' });
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Primary provider (ollama) failed. Switching to fallback (gemini).'),
            expect.any(Error)
        );
    });

    it('should throw if fallback also fails', async () => {
        // @ts-ignore
        service.fallbackProvider = {
            name: 'gemini',
            generate: async () => { throw new Error('Gemini Failed'); }
        };

        await expect(service.ask({ prompt: 'test' })).rejects.toThrow('Gemini Failed');
    });
});
