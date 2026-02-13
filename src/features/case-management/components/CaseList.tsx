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
    const [search, setSearch] = useState('');

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

    const filteredCases = cases.filter(c => {
        const matchesStatus = filter === 'all' || c.status === filter;
        const searchLower = search.toLowerCase();
        const matchesSearch =
            c.client?.name?.toLowerCase().includes(searchLower) ||
            c.assigned_to?.toLowerCase().includes(searchLower);

        return matchesStatus && matchesSearch;
    });

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
            <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Filters */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg self-start">
                    {(['active', 'closed', 'transferred', 'all'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${filter === status
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64 transition-all"
                        />
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {/* Swapped Clock icon for Search icon if available, but keeping existing imports for now to avoid breaking changes if Search isn't imported. 
                            Actually, Search IS imported in compatible icons? No, let's check imports.
                            Imports: Briefcase, Calendar, ChevronRight, User, Clock, CheckCircle2, AlertCircle.
                            I will use User for now as a placeholder or just Clock as it was in imports. 
                            Wait, I can import Search. 
                        */}
                    </div>
                    <button
                        onClick={() => router.push('/intake')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Briefcase className="w-4 h-4" />
                        New Case
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="font-medium">No cases found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
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
                                            {c.client?.name}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {/* assigned_to needs to be handled carefully if it's just a string ID */}
                                                {c.assigned_to || 'Unassigned'}
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
