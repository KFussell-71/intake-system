import React from 'react';

export const dynamic = 'force-dynamic';

import { SupervisorDashboard } from '@/features/supervisor/components/SupervisorDashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SupervisorPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
        // Redirect unauthorized users to their appropriate dashboard or error page
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Supervisor Portal</h1>
            <SupervisorDashboard />
        </div>
    );
}
