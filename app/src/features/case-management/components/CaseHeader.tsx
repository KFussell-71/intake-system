'use client';

import { Case, CaseStage } from '@/types/case';
import { GlassCard } from '@/components/ui/GlassCard';
import { Calendar, User, Briefcase, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { caseService } from '@/services/CaseService';
import { toast } from 'sonner';

interface Props {
    caseData: Case;
    onCaseUpdated: (updatedCase: Case) => void;
}

export function CaseHeader({ caseData, onCaseUpdated }: Props) {
    const [loading, setLoading] = useState(false);

    const stages: CaseStage[] = ['intake', 'assessment', 'planning', 'service_delivery', 'review'];

    const handleStageChange = async (newStage: CaseStage) => {
        if (newStage === caseData.stage) return;
        setLoading(true);
        try {
            const updated = await caseService.updateCaseStage(caseData.id, newStage);
            if (updated) {
                onCaseUpdated(updated);
                toast.success(`Case moved to ${newStage.replace('_', ' ')}`);
            }
        } catch (error) {
            console.error('Failed to update stage:', error);
            toast.error('Failed to update stage');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {(caseData as any).client?.first_name} {(caseData as any).client?.last_name}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${caseData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {caseData.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {(caseData as any).assigned_to?.first_name || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Opened {format(new Date(caseData.start_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Current Stage</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                        {stages.map((stage) => (
                            <button
                                key={stage}
                                disabled={loading}
                                onClick={() => handleStageChange(stage)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${caseData.stage === stage
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {stage === 'service_delivery' ? 'Delivery' : stage}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
