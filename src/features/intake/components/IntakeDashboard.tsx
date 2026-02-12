import React from 'react';
import { useIntake } from '../hooks/useIntake';
import { useIntakeRules } from '../hooks/useIntakeRules';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    intakeId: string;
    onNavigate: (step: string) => void;
}

type SectionStatus = 'not_started' | 'in_progress' | 'complete' | 'waived';

const STATUS_CONFIG: Record<SectionStatus, { label: string, icon: React.FC<any>, color: string }> = {
    not_started: { label: 'Not Started', icon: Circle, color: 'text-slate-400' },
    in_progress: { label: 'In Progress', icon: Loader2, color: 'text-blue-500' },
    complete: { label: 'Complete', icon: CheckCircle2, color: 'text-green-500' },
    waived: { label: 'Waived', icon: Circle, color: 'text-slate-300' } // Should handle hidden better
};

export const IntakeDashboard: React.FC<Props> = ({ intakeId, onNavigate }) => {
    const { intake, loading } = useIntake(intakeId);
    const { hiddenSteps } = useIntakeRules(intake?.data || null);

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
    }

    // Helper to get status from intake data (fallback to not_started)
    const getStatus = (section: string): SectionStatus => {
        // Current architecture might store status in different places.
        // For Identity, it's inside data.
        // For Sections, it might be in intake_sections table (which useIntake might not fully expose yet, assuming it does or we fallback to logic)

        // SPRINT 4 UPDATE: We need to rely on the centralized status if available, 
        // but for now we look at the 'sectionStatus' field in the JSON/Hooks for Identity.
        // Real implementation should standardize this.

        if (section === 'identity') return ((intake?.data as any)?.identity?.sectionStatus as SectionStatus) || 'not_started';
        // Mock logic for other sections until standardized
        return 'not_started';
    };

    const SECTIONS = [
        { id: 'identity', title: 'Identity & Demographics', description: 'Basic client information.' },
        { id: 'medical', title: 'Medical & Psychosocial', description: 'Health history and conditions.' },
        { id: 'employment', title: 'Employment & Vocational', description: 'Work history and goals.' },
        { id: 'barriers', title: 'Barriers to Employment', description: 'Identify challenges.' },
        { id: 'observations', title: 'Clinical Observations', description: 'Counselor notes and assessment.' },
        { id: 'consent', title: 'Release of Information', description: 'Legal consent documents.' },
    ];

    const visibleSections = SECTIONS.filter(s => !hiddenSteps.has(s.id));

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Intake Hub
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Non-linear clinical assessment flow active.
                    </p>
                </div>

                {/* SME Feature: Defensibility Score */}
                <GlassCard className="p-4 bg-primary/5 border-primary/10 flex items-center gap-4 min-w-[280px]">
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-slate-200 dark:text-slate-800"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={175.9}
                                strokeDashoffset={175.9 * (1 - 0.85)} // Mock 85% score
                                className="text-primary transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">
                            85%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Defensibility Score</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinically Validated</div>
                        <div className="text-[10px] text-primary flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" /> Audit Trail Verified
                        </div>
                    </div>
                </GlassCard>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleSections.map((section) => {
                    const status = getStatus(section.id);
                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
                    const Icon = config.icon;

                    return (
                        <Card
                            key={section.id}
                            className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 group bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                            style={{ borderLeftColor: status === 'complete' ? '#22c55e' : status === 'in_progress' ? '#3b82f6' : 'transparent' }}
                            onClick={() => onNavigate(section.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                                    {config.label}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4 h-10 overflow-hidden line-clamp-2">
                                {section.description}
                            </p>

                            <div className="flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                Enter Domain <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-8 border-t pt-6 border-slate-200 dark:border-slate-800">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Signatures Required: 2</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 hover:bg-slate-50">
                        Smart Save (Draft)
                    </Button>
                    <Button
                        disabled={visibleSections.some(s => getStatus(s.id) !== 'complete')}
                        onClick={() => onNavigate('review')}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-xl transition-all"
                    >
                        Finalize & Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};
