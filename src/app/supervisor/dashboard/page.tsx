import React from 'react';
import { dashboardRepository } from '@/repositories/DashboardRepository';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';
import { RefreshCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export const dynamic = 'force-dynamic'; // Ensure real-time data

export default async function DashboardPage() {
    // Parallel data fetching for performance
    const [analytics, trends] = await Promise.all([
        dashboardRepository.getAnalyticsSummary(),
        dashboardRepository.getIntakeTrends(30)
    ]);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Intake Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Real-time clinical insights and operational metrics.
                    </p>
                </div>

                <form action={async () => {
                    'use server';
                    // This is a "Refresh" button that just re-renders the server component
                }}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Data
                    </button>
                </form>
            </header>

            {/* Pass server data to client visualizer */}
            <DashboardCharts analytics={analytics} trends={trends} />
        </div>
    );
}
