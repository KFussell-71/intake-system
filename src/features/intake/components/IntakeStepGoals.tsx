import React from 'react';
import { Target } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepGoals: React.FC<Props> = ({ formData, onChange }) => {
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
            />
            <ElegantTextarea
                label="Education & Training Goals"
                name="educationGoals"
                value={formData.educationGoals}
                onChange={onChange}
                placeholder="Degrees, certifications, or vocational training required?"
            />
            <ElegantTextarea
                label="Housing Stability Needs"
                name="housingNeeds"
                value={formData.housingNeeds}
                onChange={onChange}
                placeholder="Status of current housing and any immediate needs..."
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
                    />

                    <ElegantTextarea
                        name="motivationFactors"
                        label="What helps you stay motivated or accountable?"
                        value={formData.motivationFactors}
                        onChange={onChange}
                        placeholder="Family, financial goals, independence..."
                        className="bg-white/50 min-h-[80px]"
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
                                        // Mock event for number input
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
                        <p className="text-xs text-slate-500 mt-2 flex justify-between w-full max-w-[440px]">
                            <span>Not Ready</span>
                            <span>Extremely Ready</span>
                        </p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
