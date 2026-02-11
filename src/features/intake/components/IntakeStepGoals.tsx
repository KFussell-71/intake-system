import React from 'react';
import { Target } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { any } from '../types/intake';
import { CounselorRationaleField } from './CounselorRationaleField';
import { AISuccessSuggestions } from './AISuccessSuggestions';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: Record<string, string>;
}

export const IntakeStepGoals: React.FC<Props> = ({ formData, onChange, errors = {} }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Individual Service Plan (ISP)
            </h2>

            <ElegantTextarea
                label="Primary Employment Goals"
                name="employmentGoals"
                value={formData.employmentGoals}
                onChange={onChange}
                placeholder="What kind of work does the client want to pursue?"
                enableDictation
                error={errors.employmentGoals}
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
                error={errors.educationGoals}
            />
            <ElegantTextarea
                label="Housing Stability Needs"
                name="housingNeeds"
                value={formData.housingNeeds}
                onChange={onChange}
                placeholder="Status of current housing and any immediate needs..."
                enableDictation
                error={errors.housingNeeds}
            />

            <GlassCard className="p-6 mt-6 border border-white/20">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Participant Strengths & Motivation</h4>

                <div className="space-y-4">
                    <ElegantTextarea
                        name="keyStrengths"
                        label="Key Strengths"
                        value={formData.keyStrengths}
                        onChange={onChange}
                        placeholder="What are the client's primary strengths?"
                        className="bg-white/50 min-h-[80px]"
                        enableDictation
                    />

                    <ElegantTextarea
                        name="motivationFactors"
                        label="What helps you stay motivated or accountable?"
                        value={formData.motivationFactors}
                        onChange={onChange}
                        placeholder="Family, financial goals, independence..."
                        className="bg-white/50 min-h-[80px]"
                        enableDictation
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Readiness to Work (1-10)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => {
                                        const event = {
                                            target: {
                                                name: 'readinessScale',
                                                value: num,
                                                type: 'number'
                                            }
                                        } as any;
                                        onChange(event);
                                    }}
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                        ${formData.readinessScale === num
                                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-md'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}
                                    `}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>

            <CounselorRationaleField
                label="Career Plan Analysis"
                name="employmentObservations"
                value={formData.employmentObservations || ''}
                onChange={onChange as any}
                placeholder="Document your professional assessment of the client's goals and how they align with their identified strengths/barriers..."
            />

            <AISuccessSuggestions formData={formData} />

            <GlassCard className="p-6 mt-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm">30-Day Action Plan</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Target Review:</span>
                        <input
                            type="date"
                            name="targetReviewDate"
                            value={formData.targetReviewDate}
                            onChange={onChange}
                            className="text-xs bg-white dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded p-1"
                        />
                    </div>
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
                </div>
            </GlassCard>
        </div>
    );
};
