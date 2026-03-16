'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createMockSupabase } from '@/lib/supabase/mock';

export function createClient() {
    // Mock override for Demo/Training mode
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true') {
        return createMockSupabase();
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
