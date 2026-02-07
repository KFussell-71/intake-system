"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Users } from 'lucide-react';
import { generateClientCSV, generateIntakeMetadataCSV } from '@/app/actions/reportingActions';

export function DataExportCard() {
    const [loading, setLoading] = useState('');

    const handleExport = async (type: 'clients' | 'intakes') => {
        setLoading(type);
        try {
            const csv = type === 'clients' ? await generateClientCSV() : await generateIntakeMetadataCSV();

            if (!csv) {
                alert('No data to export.');
                return;
            }

            // Client-side download trigger
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intake_export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Export failed');
        } finally {
            setLoading('');
        }
    };

    return (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-slate-500" />
                Data Export Center
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-1 hover:bg-slate-50"
                    onClick={() => handleExport('clients')}
                    disabled={!!loading}
                >
                    <div className="flex items-center gap-2 font-semibold">
                        <Users className="w-4 h-4 text-blue-600" />
                        All Clients (CSV)
                    </div>
                    <p className="text-xs text-slate-500">
                        Export full demographic and contact list.
                    </p>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-1 hover:bg-slate-50"
                    onClick={() => handleExport('intakes')}
                    disabled={!!loading}
                >
                    <div className="flex items-center gap-2 font-semibold">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Intake Metadata (CSV)
                    </div>
                    <p className="text-xs text-slate-500">
                        Export status, timestamps, and staff assignments.
                    </p>
                </Button>
            </div>
        </Card>
    );
}
