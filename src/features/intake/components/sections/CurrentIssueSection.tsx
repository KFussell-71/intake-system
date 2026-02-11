import React from 'react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { any } from '../../types/intake';
import { AlertCircle, Clock, ShieldAlert, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const CurrentIssueSection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6 border-l-4 border-l-primary/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <AlertCircle className="w-5 h-5 text-primary" />
                Current Issue & Needs
            </h3>

            <div className="space-y-6">
                <ElegantTextarea
                    label="Reason for Visit (In your own words)"
                    name="issueReason"
                    value={formData.issueReason}
                    onChange={onChange}
                    placeholder="Describe the main reason for your visit today..."
                    className="min-h-[100px]"
                    enableDictation
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ElegantTextarea
                        label="Duration of Problem"
                        name="issueDuration"
                        value={formData.issueDuration}
                        onChange={onChange}
                        placeholder="How long has this been a problem?"
                        className="min-h-[80px]"
                    />
                    <ElegantTextarea
                        label="Immediate Need"
                        name="issueImmediateNeed"
                        value={formData.issueImmediateNeed}
                        onChange={onChange}
                        placeholder="What is your most immediate need?"
                        className="min-h-[80px]"
                    />
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Are you in any immediate physical danger?
                    </label>
                    <div className="flex gap-4">
                        {['No, I am safe', 'Yes, I need help', 'Unsure'].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="issuePhysicalDanger"
                                    value={option}
                                    checked={formData.issuePhysicalDanger === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-red-900 dark:text-red-200">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <ElegantTextarea
                    label="Desired Outcome"
                    name="issueDesiredOutcome"
                    value={formData.issueDesiredOutcome}
                    onChange={onChange}
                    placeholder="What do you hope to see as the outcome of this evaluation/counseling/treatment?"
                    className="min-h-[100px]"
                    enableDictation
                />
            </div>
        </GlassCard>
    );
};
