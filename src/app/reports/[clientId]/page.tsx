import React from 'react';
import { ReportView } from '@/features/reports/components/ReportView';

interface PageProps {
    params: Promise<{ clientId: string }>;
}

export default async function ReportPage(props: PageProps) {
    const params = await props.params;
    return (
        <div className="container mx-auto py-8">
            <ReportView clientId={params.clientId} />
        </div>
    );
}
