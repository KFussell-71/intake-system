
import { AIProvider, AIRequest } from '../types';

export class MockAIProvider implements AIProvider {
    name = 'mock';

    async generate(req: AIRequest): Promise<string> {
        console.log('[MockAIProvider] Generating response for:', req.prompt);

        // Simple keyword matching to simulate ResourceMatcherAgent logic
        const promptLower = req.prompt.toLowerCase();

        if (promptLower.includes('food') || promptLower.includes('hungry')) {
            return JSON.stringify({
                category: 'Food',
                reasoning: 'The user explicitly requested food assistance.',
                keywords: ['food', 'groceries', 'pantry', 'hunger']
            });
        }

        if (promptLower.includes('job') || promptLower.includes('employment') || promptLower.includes('work')) {
            return JSON.stringify({
                category: 'Employment',
                reasoning: 'The user is looking for job or work opportunities.',
                keywords: ['job', 'employment', 'career', 'work']
            });
        }

        if (promptLower.includes('house') || promptLower.includes('shelter') || promptLower.includes('homeless')) {
            return JSON.stringify({
                category: 'Housing',
                reasoning: 'The user expressed a need for housing or shelter.',
                keywords: ['housing', 'shelter', 'homeless', 'rent']
            });
        }

        // Default fallback
        return JSON.stringify({
            category: 'Other',
            reasoning: 'Could not determine specific category from input.',
            keywords: ['general', 'assistance']
        });
    }
}
