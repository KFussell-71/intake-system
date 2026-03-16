'use client';

import React from 'react';
import { TelemetryDashboard } from '@/features/admin/components/TelemetryDashboard';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TelemetryPage() {
    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors font-semibold mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-bold mb-2">Command Center</h1>
                        <p className="text-slate-500 font-medium">Systemwide Observability, Latency Tracing, and Risk Audits.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-3xl">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                                <ShieldAlert className="w-5 h-5" />
                                <span>HIPAA Audit Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <TelemetryDashboard />
            </div>
        </div>
    );
}
