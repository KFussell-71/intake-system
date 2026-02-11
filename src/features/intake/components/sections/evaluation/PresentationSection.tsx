import React from 'react';
import { any } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { MessageSquare, HeartHandshake } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PresentationSection: React.FC<Props> = ({ formData, onChange }) => {

    // Helper for multi-select checkboxes
    const handleMultiSelect = (field: keyof any, value: string, checked: boolean) => {
        const current = (formData[field] as string[]) || [];
        const updated = checked
            ? [...current, value]
            : current.filter(item => item !== value);

        onChange({
            target: { name: field, value: updated }
        } as any);
    };

    return (
        <div className="space-y-6">
            {/* Presenting Issue */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Presenting Issue
                </h3>
                <div className="space-y-6">
                    <ElegantTextarea
                        label="Main Issue (Client Description)"
                        name="presentingIssueDescription"
                        value={formData.presentingIssueDescription}
                        onChange={onChange}
                        placeholder="How does the client describe their reason for needing help?"
                        enableDictation
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ElegantTextarea
                            label="Duration"
                            name="presentingIssueDuration"
                            value={formData.presentingIssueDuration}
                            onChange={onChange}
                            placeholder="How long has this been a problem?"
                        />
                        <ElegantTextarea
                            label="Immediate Need"
                            name="presentingIssueImmediateNeed"
                            value={formData.presentingIssueImmediateNeed}
                            onChange={onChange}
                            placeholder="What is the most immediate need?"
                        />
                    </div>
                    <ElegantTextarea
                        label="Safety Concerns"
                        name="presentingIssueSafetyConcerns"
                        value={formData.presentingIssueSafetyConcerns}
                        onChange={onChange}
                        placeholder="Has client noted physical safety concerns?"
                    />
                    <ElegantTextarea
                        label="Desired Outcome"
                        name="presentingIssueGoals"
                        value={formData.presentingIssueGoals}
                        onChange={onChange}
                        placeholder="What do they hope to see as the outcome?"
                    />
                </div>
            </GlassCard>

            {/* Supports & Strengths */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <HeartHandshake className="w-5 h-5 text-primary" />
                    Supports & Strengths
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Resources */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Personal Resources</h4>
                        <div className="space-y-2">
                            {[
                                'Live Independently', 'Has Bank Account', 'Good Judgement',
                                'Problem-solving skills', 'Articulate needs/concerns', 'Coping skills',
                                'Employed', 'Takes responsibility', 'Permanent home',
                                'Has future goals', 'Able to ask for assistance'
                            ].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.personalResources || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('personalResources', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Support Network */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Support Network</h4>
                        <div className="space-y-2">
                            {[
                                'Family', 'Friends', 'Partner/Significant Other',
                                'Church', 'Community Support Group', 'Charity Agency',
                                '12-step Program', 'Government Program'
                            ].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.supportNetwork || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('supportNetwork', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-4">
                            <ElegantTextarea
                                label="Support Network Comments"
                                name="supportNetworkComments"
                                value={formData.supportNetworkComments}
                                onChange={onChange}
                                placeholder="Additional details..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
