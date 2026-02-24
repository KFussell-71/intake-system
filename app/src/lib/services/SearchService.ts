/**
 * SearchService.ts
 * Wrapper for Serper.dev (Google Search API)
 * Used to ground AI suggestions in real-time local data.
 */

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

export class SearchService {
    private static API_KEY = process.env.SERPER_API_KEY;

    static async search(query: string): Promise<SearchResult[]> {
        if (!this.API_KEY) {
            console.warn('SERPER_API_KEY not found. Search grounding skipped.');
            return [];
        }

        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: query,
                    num: 5, // Get top 5 results
                }),
            });

            const data = await response.json();

            return (data.organic || []).map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
            }));
        } catch (error) {
            console.error('Search API error:', error);
            return [];
        }
    }
}
