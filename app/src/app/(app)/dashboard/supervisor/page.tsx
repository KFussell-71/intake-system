import { SupervisorDashboard } from '@/features/supervisor/components/SupervisorDashboard';

export const dynamic = 'force-dynamic';

export default function SupervisorDashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <SupervisorDashboard />
        </div>
    );
}
