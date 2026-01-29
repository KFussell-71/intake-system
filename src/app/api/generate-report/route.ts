import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runDorAgent, IntakeBundle } from '@/lib/agents/dorAgent';

export const runtime = 'edge'; // Optional: Use edge if compatible, or default to node

export async function POST(req: Request) {
    try {
        const { clientId } = await req.json();

        if (!clientId) {
            return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
        }

        // Initialize Supabase - using process.env directly or unifiedConfig if imported
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Client Bundle via RPC
        const { data: bundle, error } = await supabase.rpc('get_client_intake_bundle', {
            client_id: clientId
        });

        if (error) {
            console.error('RPC Error:', error);
            return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 });
        }

        if (!bundle) {
            return NextResponse.json({ error: 'Client data not found' }, { status: 404 });
        }

        // 2. Run AI Agent
        const markdown = await runDorAgent(bundle as IntakeBundle);

        // 3. Return Markdown Draft
        return NextResponse.json({
            success: true,
            markdown,
            bundle // Optional: return bundle for UI debugging
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
