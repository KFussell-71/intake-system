'use client';

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { BarChart3, PieChart, TrendingUp, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { reportController } from "@/controllers/ReportController";
import { ReadinessTrendChart } from "@/features/reports/components/ReadinessTrendChart";
import { MonthlyVolumeChart } from "@/features/reports/components/MonthlyVolumeChart";
import { DemographicsChart } from "@/features/reports/components/DemographicsChart";
import { PlacementOutcomeChart } from "@/features/reports/components/PlacementOutcomeChart";

export default function ReportsPage() {
    const router = useRouter();
    const [volume, setVolume] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [demographics, setDemographics] = useState({ employed: 0, unemployed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [volRes, demoRes] = await Promise.all([
                reportController.getMonthlyVolume(),
                reportController.getDemographics()
            ]);

            if (volRes.success && volRes.data) setVolume(volRes.data);
            if (demoRes.success && demoRes.data) setDemographics(demoRes.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const displayMonths = Array.from({ length: 6 }, (_, i) => months[(currentMonth - 5 + i + 12) % 12]);

    const maxVolume = Math.max(...volume, 1);

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
                    <MonthlyVolumeChart data={volume} />
                    <DemographicsChart data={demographics} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <PlacementOutcomeChart />
                    <ReadinessTrendChart />
                </div>
            </main>
        </div>
    );
}
