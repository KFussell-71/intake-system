import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runDorAgent, IntakeBundle } from '@/lib/agents/dorAgent';

export const runtime = 'edge'; // Optional: Use edge if compatible, or default to node

import { validateIntakeBundle } from '@/lib/validations/generationValidator';

export async function POST(req: Request) {
    try {
        const { clientId } = await req.json();

        if (!clientId) {
            return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Client Bundle via RPC (Authoritative Source)
        const { data: bundle, error } = await supabase.rpc('get_client_intake_bundle', {
            p_client_id: clientId
        });

        if (error) throw new Error(`RPC Error: ${error.message}`);
        if (!bundle) return NextResponse.json({ error: 'Client bundle not found' }, { status: 404 });

        // 2. Compliance Gate (Validation)
        const validation = validateIntakeBundle(bundle as IntakeBundle);
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Cannot generate report. Incomplete DOR record.',
                missingFields: validation.missing
            }, { status: 422 });
        }

        // 3. Run AI Agent (Locked Prompt)
        const markdown = await runDorAgent(bundle as IntakeBundle);

        return NextResponse.json({
            success: true,
            markdown,
            bundle
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
