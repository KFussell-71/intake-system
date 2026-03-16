import React from 'react';

export const dynamic = 'force-dynamic';

import { verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { SupervisorDashboard } from '@/features/supervisor/components/SupervisorDashboard';
import { redirect } from 'next/navigation';

export default async function SupervisorPage() {
    const auth = await verifyAuthorization(['admin', 'supervisor']);

    if (!auth.authorized) {
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
