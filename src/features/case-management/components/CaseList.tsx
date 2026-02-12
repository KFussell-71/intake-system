'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Case, CaseStatus, CaseStage } from '@/types/case';
import { caseService } from '@/services/CaseService';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Briefcase,
    Calendar,
    ChevronRight,
    User,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CaseList() {
    const router = useRouter();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<CaseStatus | 'all'>('active');

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        try {
            const data = await caseService.getCases();
            setCases(data);
        } catch (error) {
            console.error('Failed to load cases:', error);
            toast.error('Failed to load cases');
        } finally {
            setLoading(false);
        }
    };

    const getStageColor = (stage: CaseStage) => {
        switch (stage) {
            case 'intake': return 'text-blue-600 bg-blue-100';
            case 'assessment': return 'text-purple-600 bg-purple-100';
            case 'planning': return 'text-amber-600 bg-amber-100';
            case 'service_delivery': return 'text-green-600 bg-green-100';
            case 'review': return 'text-indigo-600 bg-indigo-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    const filteredCases = cases.filter(c => filter === 'all' || c.status === filter);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-2">
                {(['active', 'closed', 'transferred', 'all'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No cases found matching your filter.
                    </div>
                ) : (
                    filteredCases.map((c: any) => (
                        <GlassCard
                            key={c.id}
                            className="p-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/cases/${c.id}`)}
                        >
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {c.client?.first_name} {c.client?.last_name}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {c.assigned_to?.first_name ? `${c.assigned_to.first_name} ${c.assigned_to.last_name}` : 'Unassigned'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Started {format(new Date(c.start_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStageColor(c.stage)}`}>
                                            {c.stage.replace('_', ' ')}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1 capitalize">
                                            {c.status}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
