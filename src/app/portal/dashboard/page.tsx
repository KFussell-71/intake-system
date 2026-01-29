'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileText, CheckCircle, Clock } from 'lucide-react';

export default function ClientDashboard() {
    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, Alex</h1>
                        <p className="text-slate-500">Case #DOR-2026-X92</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Active
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">Next Appointment</h3>
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-primary" />
                            <div>
                                <p className="font-bold text-lg">Feb 12, 10:00 AM</p>
                                <p className="text-xs text-slate-500">Intake Interview</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">Documents</h3>
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-accent" />
                            <div>
                                <p className="font-bold text-lg">2 Pending</p>
                                <p className="text-xs text-slate-500">ID & Resume needed</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">Readiness Score</h3>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="font-bold text-lg">7/10</p>
                                <p className="text-xs text-slate-500">Self-Assessed</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
