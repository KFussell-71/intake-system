'use client';

import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { BarChart3, PieChart, TrendingUp, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark">
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ActionButton variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← Back</ActionButton>
                        <h1 className="text-xl font-bold">Service Reports</h1>
                    </div>
                    <ActionButton variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>Export All</ActionButton>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Monthly Intake Volume
                        </h3>
                        <div className="h-64 flex items-end justify-between gap-2 px-4 pb-2 border-b border-slate-200 dark:border-white/10">
                            {[45, 60, 75, 50, 80, 95].map((h, i) => (
                                <div key={i} className="w-1/6 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg relative group">
                                    <div style={{ height: `${h}%` }} className="bg-primary absolute bottom-0 w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-accent" />
                            Demographics Overview
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-8 border-accent/20 border-t-accent flex items-center justify-center">
                                <span className="text-2xl font-bold text-accent">342</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-sm">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-accent rounded-full" /> Employed</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-accent/20 rounded-full" /> Unemployed</span>
                        </div>
                    </GlassCard>
                </div>
            </main>
        </div>
    );
}
