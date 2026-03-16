import { AvailabilityManager } from '@/features/scheduling/components/AvailabilityManager';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { redirect } from 'next/navigation';

export default async function SchedulePage() {
    const auth = await verifyAuthentication();

    if (!auth.authenticated || !auth.userId) {
        redirect('/login');
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
                    <p className="text-slate-500">Manage your availability and view appointments.</p>
                </div>
            </div>

            <AvailabilityManager userId={auth.userId!} />
        </div>
    );
}
