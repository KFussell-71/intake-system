'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { getStaffingForecastAction } from '@/app/actions/staffingActions';
import { StaffingForecast } from '@/repositories/StaffingRepository';

export const StaffingForecastWidget = () => {
    const [forecast, setForecast] = useState<StaffingForecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const res = await getStaffingForecastAction('intake_specialist');
                if (res.success && res.data) {
                    setForecast(res.data);
                } else {
                    setError(res.error || 'Failed to load forecast');
                }
            } catch (err) {
                setError('System error loading forecast');
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, []);

    if (loading) return (
        <GlassCard className="h-full animate-pulse flex items-center justify-center min-h-[200px]">
            <div className="text-slate-400 text-sm">Calculating Workforce Physics...</div>
        </GlassCard>
    );

    if (error) return (
        <GlassCard className="h-full border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Model Error</h3>
            </div>
            <p className="text-xs text-slate-500">{error}</p>
        </GlassCard>
    );

    if (!forecast) return null;

    // Derived Metrics
    // We assume current staff is ~5 for this demo, or we could fetch it.
    // Let's hardcode a "Current Capacity" for the visual comparison or pass it in.
    const CURRENT_TEAM_SIZE = 4.0;
    const deficit = forecast.required_ftes - CURRENT_TEAM_SIZE;
    const isDeficit = deficit > 0;
    const utilization = (forecast.required_ftes / CURRENT_TEAM_SIZE) * 100;

    return (
        <GlassCard className="h-full relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Staffing Optimization
                    </h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                        Intake Specialist Unit
                    </p>
                </div>
                {isDeficit ? (
                    <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold flex items-center gap-1 border border-red-500/20">
                        <TrendingUp className="w-3 h-3" />
                        Shortfall Detected
                    </div>
                ) : (
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Optimal
                    </div>
                )}
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Current Demand</p>
                    <div className="text-2xl font-bold font-mono">
                        {forecast.projected_load_hours} <span className="text-sm font-sans font-normal text-slate-400">hours/wk</span>
                    </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Required FTEs</p>
                    <div className="text-2xl font-bold font-mono text-indigo-400">
                        {forecast.required_ftes} <span className="text-sm font-sans font-normal text-slate-400">staff</span>
                    </div>
                </div>
            </div>

            {/* Visualizer */}
            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Capacity Utilization</span>
                    <span className={isDeficit ? "text-red-500" : "text-emerald-500"}>
                        {utilization.toFixed(1)}%
                    </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${isDeficit ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                </div>
            </div>

            {/* Intelligence Insight */}
            <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-lg p-4">
                <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2">Institutional Intelligence</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Based on current case complexity ({forecast.details?.complexity || 1.0}x multiplier),
                    {isDeficit
                        ? ` we project a shortfall of ${deficit.toFixed(2)} FTEs. Immediate hiring or overtime authorization recommended.`
                        : ` the unit is operating within capacity buffer.`
                    }
                </p>
            </div>
        </GlassCard>
    );
};
