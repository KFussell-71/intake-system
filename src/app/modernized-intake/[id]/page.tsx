import React from 'react';
import { ModernizedIntakeWizard } from '@/features/intake/components/ModernizedIntakeWizard';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { redirect } from 'next/navigation';

export default async function ModernizedIntakePage({ params }: { params: { id: string } }) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <ModernizedIntakeWizard intakeId={params.id} />
        </div>
    );
}
