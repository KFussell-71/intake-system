import React from 'react';
import { IntakeReportEditor } from '@/features/reports/components/IntakeReportEditor';

interface PageProps {
    params: Promise<{ clientId: string }>;
}

export default async function ReportPage(props: PageProps) {
    const params = await props.params; // Next.js 15+ params are promises in async layouts/pages sometimes, defaulting to standard async
    return (
        <div className="container mx-auto py-8">
            <IntakeReportEditor clientId={params.clientId} />
        </div>
    );
}
