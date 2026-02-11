import React from 'react';
import { Briefcase, GraduationCap, Hammer } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { VocationalData } from '@/features/intake/types/intake';

interface Props {
    formData: VocationalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const VocationalHistoryPanel: React.FC<Props> = ({ formData, onChange }) => {

    // Helper for multi-select
    const handleMultiSelect = (field: keyof VocationalData, value: string, checked: boolean) => {
        const current = (formData[field] as string[]) || [];
        const updated = checked
            ? [...current, value]
            : current.filter(item => item !== value);

        onChange({
            target: { name: field, value: updated, type: 'custom' }
        } as any);
    };

    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Education & Training
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Highest Level of Education</label>
                        <select
                            name="educationLevel"
                            value={formData.educationLevel}
                            onChange={onChange}
                            className="w-full rounded-lg border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-primary focus:border-primary p-2.5 text-sm"
                        >
                            <option value="">Select...</option>
                            <option value="None">None</option>
                            <option value="Some High School">Some High School</option>
                            <option value="GED">GED</option>
                            <option value="High School Diploma">High School Diploma</option>
                            <option value="Some College">Some College</option>
                            <option value="Associates Degree">Associates Degree</option>
                            <option value="Bachelors Degree">Bachelors Degree</option>
                            <option value="Masters Degree">Masters Degree</option>
                            <option value="Trade School">Trade School / Vocational Certification</option>
                        </select>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Work Experience
                </h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Employment Type History</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Full-time', 'Part-time', 'Temporary', 'Seasonal', 'Gig Work', 'Self-Employed'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={(formData.employmentType || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('employmentType', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <ElegantTextarea
                        label="Work History Summary"
                        name="workExperienceSummary"
                        value={formData.workExperienceSummary}
                        onChange={onChange}
                        placeholder="Describe past jobs, durations, and reasons for leaving..."
                        rows={4}
                        enableDictation
                    />
                </div>
            </GlassCard>

            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Hammer className="w-5 h-5 text-primary" />
                    Skills & Preferences
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Transferable Skills</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Customer Service', 'Cash Handling', 'General Labor', 'Use of Power Tools', 'Driving', 'Computer Skills', 'Cleaning/Janitorial', 'Cooking/Food Service', 'Childcare', 'Warehouse/Stocking'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={(formData.transferableSkills || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('transferableSkills', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <ElegantInput
                            label="Other Skills"
                            name="transferableSkillsOther"
                            value={formData.transferableSkillsOther}
                            onChange={onChange}
                            placeholder="Specify other skills..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Industry Preferences</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Retail', 'Food Service', 'Construction', 'Warehousing', 'Healthcare', 'Administrative', 'Transportation', 'Hospitality', 'Manufacturing'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={(formData.industryPreferences || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('industryPreferences', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <ElegantInput
                            label="Other Industries"
                            name="industryOther"
                            value={formData.industryOther}
                            onChange={onChange}
                            placeholder="Specify..."
                        />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
