import React from 'react';
import { useIntake } from '../hooks/useIntake';
import { useIntakeRules } from '../hooks/useIntakeRules';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

        if (section === 'identity') return (intake?.data?.identity?.sectionStatus as SectionStatus) || 'not_started';
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
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Intake Dashboard
                </h1>
                <p className="text-slate-500 mt-2">
                    Manage the intake process. Complete sections in any order.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleSections.map((section) => {
                    const status = getStatus(section.id);
                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
                    const Icon = config.icon;

                    return (
                        <Card
                            key={section.id}
                            className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 group"
                            style={{ borderLeftColor: status === 'complete' ? '#22c55e' : status === 'in_progress' ? '#3b82f6' : 'transparent' }}
                            onClick={() => onNavigate(section.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                                    {config.label}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4">
                                {section.description}
                            </p>

                            <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                Open Section <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
                {/* Logic to show 'Submit' mostly happens when all required are done */}
                <Button variant="outline" disabled>
                    Save as Draft (Auto-saved)
                </Button>
                <Button
                    disabled={visibleSections.some(s => getStatus(s.id) !== 'complete')}
                    className="bg-green-600 hover:bg-green-700"
                >
                    Submit Intake
                </Button>
            </div>
        </div>
    );
};
