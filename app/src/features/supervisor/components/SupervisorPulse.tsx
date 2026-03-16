import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

interface PulseStats {
    avgApprovalTime: string; // "4.2 Hours"
    criticalMismatches: number; // AI Flags
    slaBreaches: number; // Pending > 24h
}

import { useTraining } from '@/features/training/context/TrainingContext';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export const SupervisorPulse: React.FC<{ stats: PulseStats }> = ({ stats }) => {
    const { isTrainingMode, setTrainingMode } = useTraining();

    return (
        <div className="space-y-6 mb-6">
            {/* Control Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-lg font-bold">System Pulse</h2>
                    <p className="text-xs text-slate-500">Real-time operational metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Training Mode</span>
                    <Switch
                        checked={isTrainingMode}
                        onCheckedChange={setTrainingMode}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                    {isTrainingMode && (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50">
                            Active
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* 1. Velocity Metric */}
                <Card className="bg-blue-950 text-white border-blue-900 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-800 rounded-full">
                            <Clock className="w-6 h-6 text-blue-200" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Avg. Approval Time</p>
                            <p className="text-2xl font-bold">{stats.avgApprovalTime}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Risk Metric (AI) */}
                <Card className={`${stats.criticalMismatches > 0 ? 'bg-red-950 border-red-900' : 'bg-slate-900 border-slate-800'} text-white shadow-lg transition-colors`}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-full ${stats.criticalMismatches > 0 ? 'bg-red-800 animate-pulse' : 'bg-slate-800'}`}>
                            <AlertTriangle className={`w-6 h-6 ${stats.criticalMismatches > 0 ? 'text-red-200' : 'text-slate-200'}`} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${stats.criticalMismatches > 0 ? 'text-red-300' : 'text-slate-400'}`}>
                                Critical Risks Detected
                            </p>
                            <p className="text-2xl font-bold">{stats.criticalMismatches}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SLA Metric (Time in State) */}
                <Card className={`${stats.slaBreaches > 0 ? 'bg-orange-950 border-orange-900' : 'bg-slate-900 border-slate-800'} text-white shadow-lg`}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-full ${stats.slaBreaches > 0 ? 'bg-orange-800' : 'bg-slate-800'}`}>
                            <Activity className={`w-6 h-6 ${stats.slaBreaches > 0 ? 'text-orange-200' : 'text-slate-200'}`} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${stats.slaBreaches > 0 ? 'text-orange-300' : 'text-slate-400'}`}>
                                SLA Breaches ({'>'}24h)
                            </p>
                            <p className="text-2xl font-bold">{stats.slaBreaches}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
