import React from 'react';
import { ComplianceDashboard } from '@/features/compliance/components/ComplianceDashboard';

export default function CompliancePage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Compliance Center</h1>
            <ComplianceDashboard />
        </div>
    );
}
