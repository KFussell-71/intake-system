import React from 'react';
import { any } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { Globe, Users, BookOpen, Gavel } from 'lucide-react';
import { ElegantTextarea, ElegantInput } from '@/components/ui/ElegantInput';
import { FormCheckbox } from '@/features/intake/components/FormCheckbox';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const FamilySocialHistorySection: React.FC<Props> = ({ formData, onChange }) => {

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

            {/* Family & Culture */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Users className="w-5 h-5 text-primary" /> Family & Cultural History
                </h3>
                <div className="space-y-4">
                    <ElegantTextarea label="Family Makeup Growing Up" name="familyMakeupGrowingUp" value={formData.familyMakeupGrowingUp} onChange={onChange} placeholder="Lived with both parents, foster care, etc." rows={1} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElegantTextarea label="Family Size" name="familySize" value={formData.familySize} onChange={onChange} rows={1} />
                        <ElegantTextarea label="Feelings about Family" name="familyAttitude" value={formData.familyAttitude} onChange={onChange} rows={1} />
                    </div>
                    <ElegantTextarea label="Cultural Values (Growing Up)" name="culturalValuesGrowingUp" value={formData.culturalValuesGrowingUp} onChange={onChange} rows={1} />
                    <ElegantTextarea label="Cultural Values (Today)" name="culturalValuesCurrent" value={formData.culturalValuesCurrent} onChange={onChange} rows={1} />
                </div>
            </GlassCard>

            {/* Education & Employment */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <BookOpen className="w-5 h-5 text-primary" /> Education & Employment
                </h3>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Education Level</label>
                    <select name="educationLevel" value={formData.educationLevel} onChange={onChange} className="w-full rounded-md border-slate-200 bg-white">
                        <option value="">Select...</option>
                        {['Less than high school', 'High school', 'Some college', '2-year degree', '4-year degree', 'Master/PhD', 'Trade school'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </GlassCard>

            {/* Legal & Personal */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Gavel className="w-5 h-5 text-primary" /> Legal & Personal History
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <FormCheckbox label="Financial problems?" name="financialIssues" checked={formData.financialIssues} onChange={onChange} />
                            {formData.financialIssues && <ElegantTextarea label="Description" name="financialIssuesDescription" value={formData.financialIssuesDescription} onChange={onChange} rows={2} />}
                        </div>
                        <div>
                            <FormCheckbox label="Ever Incarcerated?" name="legalIssues" checked={formData.legalIssues} onChange={onChange} />
                            {formData.legalIssues && <ElegantTextarea label="Criminal History" name="legalIssuesDescription" value={formData.legalIssuesDescription} onChange={onChange} rows={2} />}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">History of Abuse</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                            {['None', 'As a child', 'As an adult', 'Child & Adult'].map(opt => (
                                <label key={opt} className="flex items-center gap-2"><input type="radio" name="historyOfAbuse" value={opt} checked={formData.historyOfAbuse === opt} onChange={onChange} /> <span className="text-sm">{opt}</span></label>
                            ))}
                        </div>
                        {formData.historyOfAbuse && formData.historyOfAbuse !== 'None' && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Type of Abuse</label>
                                <div className="flex flex-wrap gap-4">
                                    {['Emotional', 'Exploitation', 'Financial', 'Neglect', 'Physical', 'Sexual', 'Verbal'].map(opt => (
                                        <label key={opt} className="flex items-center gap-2"><input type="checkbox" checked={(formData.abuseTypes || []).includes(opt)} onChange={(e) => handleMultiSelect('abuseTypes', opt, e.target.checked)} /> <span className="text-sm">{opt}</span></label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
