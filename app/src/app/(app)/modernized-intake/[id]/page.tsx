import React from 'react';
import { ModernizedIntakeWizard } from '@/features/intake/components/ModernizedIntakeWizard';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { redirect } from 'next/navigation';

// Force rebuild: Fix params await
export default async function ModernizedIntakePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAuthentication();
    if (!auth.authenticated) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <ModernizedIntakeWizard intakeId={id} />
        </div>
    );
}
