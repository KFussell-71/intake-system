
import { aiService } from '@/lib/ai/UnifiedAIService';
import { ResourceService, CommunityResource } from '@/services/ResourceService';

export class ResourceMatcherAgent {

    /**
     * Analyzes a user's need statement and finds matching local resources.
     * If local resources are insufficient, suggests a web search.
     */
    static async findMatches(userNeed: string, location: string = 'Antelope Valley'): Promise<{
        matches: CommunityResource[];
        source: 'local' | 'web';
        reasoning: string;
    }> {
        // 1. Analyze Intent
        const intentPrompt = `
        Analyze the following user need statement and categorize it.
        User Need: "${userNeed}"
        
        Categories: Food, Housing, Employment, Health, Legal, Education, Other.
        
        Return ONLY a JSON object: { "category": "CategoryName", "keywords": ["keyword1", "keyword2"] }
        `;

        const intentJson = await aiService.ask({ prompt: intentPrompt, format: 'json' });
        const intent = JSON.parse(intentJson);

        // 2. Search Local DB
        const localMatches = await ResourceService.searchResources(intent.keywords[0], intent.category);

        if (localMatches.length > 0) {
            return {
                matches: localMatches,
                source: 'local',
                reasoning: `Found ${localMatches.length} verified local resources matching category '${intent.category}'.`
            };
        }

        // 3. Fallback to Web Search Suggestion
        const searchQuery = `${intent.category} resources in ${location} for ${intent.keywords.join(' ')}`;

        return {
            matches: [],
            source: 'web',
            reasoning: `No verified local resources found for "${userNeed}". Recommended web search: "${searchQuery}"`
        };
    }
}
