'use client';

import React from 'react';
import { ActivityLog } from '@/features/supervisor/components/ActivityLog';
import { ShieldCheck, Activity } from 'lucide-react';

export default function SupervisorActivityPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-24 font-body selection:bg-primary/20">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                            Activity Log
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs pl-1">
                        Supervisor Actions • Audit Trail
                    </p>
                </header>

                <ActivityLog limit={50} showFilters={true} />
            </div>
        </div>
    );
}
