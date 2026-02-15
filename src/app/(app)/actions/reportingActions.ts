"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateClientCSV() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (!data || data.length === 0) return null;

    // Convert to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).map(v => `"${v || ''}"`).join(','));
    return [headers, ...rows].join('\n');
}

export async function generateIntakeMetadataCSV() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('intakes')
        .select('id, created_at, status, user_id, client_id')
        .order('created_at', { ascending: false });

    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).map(v => `"${v || ''}"`).join(','));
    return [headers, ...rows].join('\n');
}
