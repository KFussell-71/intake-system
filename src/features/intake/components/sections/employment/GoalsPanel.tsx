import React from 'react';
import { Target } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { VocationalData } from '@/features/intake/types/intake';

interface Props {
    formData: VocationalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const GoalsPanel: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Target className="w-5 h-5 text-primary" />
                    Individual Service Plan (ISP) Goals
                </h2>

                <div className="space-y-6">
                    <ElegantTextarea
                        label="Primary Employment Goals"
                        name="employmentGoals"
                        value={formData.employmentGoals}
                        onChange={onChange}
                        placeholder="What kind of work does the client want to pursue?"
                        enableDictation
                    />
                    <ElegantTextarea
                        label="Desired Job Title(s)"
                        name="desiredJobTitles"
                        value={formData.desiredJobTitles}
                        onChange={onChange}
                        placeholder="List specific roles the client is targeting..."
                        enableDictation
                    />
                    <ElegantTextarea
                        label="Education & Training Goals"
                        name="educationGoals"
                        value={formData.educationGoals}
                        onChange={onChange}
                        placeholder="Degrees, certifications, or vocational training required?"
                        enableDictation
                    />
                    <ElegantTextarea
                        label="Housing Stability Needs"
                        name="housingNeeds"
                        value={formData.housingNeeds}
                        onChange={onChange}
                        placeholder="Status of current housing and any immediate needs..."
                        enableDictation
                    />
                </div>
            </GlassCard>

            <GlassCard className="p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm">Action Plan (ISP)</h4>
                </div>

                <div className="space-y-8">
                    {(formData.ispGoals || []).map((goal, index) => (
                        <div key={index} className="pl-4 border-l-2 border-slate-100 dark:border-white/5 space-y-4">
                            <ElegantInput
                                id={`goal-title-${index}`}
                                label={`Goal ${index + 1}`}
                                placeholder="State the goal (e.g., Update Resume)"
                                value={goal.goal}
                                onChange={(e) => {
                                    const updated = [...(formData.ispGoals || [])];
                                    updated[index].goal = e.target.value;
                                    onChange({ target: { name: 'ispGoals', value: updated } } as any);
                                }}
                                className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 py-1 focus:border-primary focus:outline-none font-medium"
                                enableDictation
                            />
                            <ElegantTextarea
                                id={`goal-steps-${index}`}
                                label="Action Steps"
                                placeholder="Steps to achieve..."
                                value={goal.actionSteps}
                                onChange={(e) => {
                                    const updated = [...(formData.ispGoals || [])];
                                    updated[index].actionSteps = e.target.value;
                                    onChange({ target: { name: 'ispGoals', value: updated } } as any);
                                }}
                                className="w-full bg-slate-50/50 dark:bg-white/5 rounded p-3 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                enableDictation
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            const updated = [...(formData.ispGoals || []), { goal: '', actionSteps: '', status: 'pending' }];
                            onChange({ target: { name: 'ispGoals', value: updated } } as any);
                        }}
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        + Add Another Goal
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
