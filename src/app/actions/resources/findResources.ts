
'use server';

import { ResourceMatcherAgent } from '@/lib/agents/resourceMatcher';
import { createClient } from '@/lib/supabase/server';

export async function findResourcesAction(userNeed: string) {
    try {
        const supabase = createClient();
        // efficient auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const result = await ResourceMatcherAgent.findMatches(userNeed);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Find Resources Error:', error);
        return { success: false, error: error.message };
    }
}
