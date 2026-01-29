import React from 'react';
import { Calendar, CheckCircle2, ListTodo } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PreparationReadinessSection: React.FC<Props> = ({ formData, onChange }) => {

    const renderItem = (
        title: string,
        subtitle: string,
        dateField: keyof IntakeFormData,
        notesField: keyof IntakeFormData,
    ) => {
        const isComplete = !!formData[dateField];

        return (
            <GlassCard className={`p-4 border border-white/20 transition-all ${isComplete ? 'bg-indigo-500/5 border-indigo-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <ListTodo className="w-4 h-4" />}
                        </div>
                        <div>
                            <span className="block font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                            <span className="text-xs text-slate-500">{subtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <ElegantInput
                        label="Target Date"
                        name={dateField}
                        value={formData[dateField] as string}
                        onChange={onChange}
                        type="date"
                        icon={<Calendar className="w-4 h-4" />}
                        className="text-sm"
                    />

                    <ElegantTextarea
                        label="Notes & Details"
                        name={notesField}
                        value={formData[notesField] as string}
                        onChange={onChange}
                        placeholder="Add specific goals or feedback..."
                        className="text-sm min-h-[80px]"
                    />
                </div>
            </GlassCard>
        );
    };

    return (
        <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-white">
                <ListTodo className="w-5 h-5 text-primary" />
                Preparation & Readiness Tracking
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Track progress on key readiness milestones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderItem('Resume Update', 'Resume will be updated by:', 'resumeUpdateDate', 'resumeUpdateNotes')}
                {renderItem('Mock Interview', 'Interview scheduled on:', 'mockInterviewDate', 'mockInterviewNotes')}
                {renderItem('Networking', 'Activity on:', 'networkingDate', 'networkingNotes')}
            </div>
        </div>
    );
};
