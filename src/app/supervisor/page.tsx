import React from 'react';
import { SupervisorDashboard } from '@/features/supervisor/components/SupervisorDashboard';

export default function SupervisorPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Supervisor Portal</h1>
            <SupervisorDashboard />
        </div>
    );
}
