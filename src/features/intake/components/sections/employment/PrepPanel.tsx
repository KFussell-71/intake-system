import React from 'react';
import { GraduationCap } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { VocationalData } from '@/features/intake/types/intake';
import { FormCheckbox } from '@/features/intake/components/FormCheckbox';

interface Props {
    formData: VocationalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PrepPanel: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Employment Preparation
                </h2>

                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Class Attendance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ElegantInput
                        label="Class 1: Fair Chance Hiring"
                        name="class1Date"
                        value={formData.class1Date}
                        onChange={onChange}
                        type="date"
                    />
                    <ElegantInput
                        label="Class 2: Interview Techniques"
                        name="class2Date"
                        value={formData.class2Date}
                        onChange={onChange}
                        type="date"
                    />
                    <ElegantInput
                        label="Class 3: Work Behaviors"
                        name="class3Date"
                        value={formData.class3Date}
                        onChange={onChange}
                        type="date"
                    />
                    <ElegantInput
                        label="Class 4: Hygiene & Grooming"
                        name="class4Date"
                        value={formData.class4Date}
                        onChange={onChange}
                        type="date"
                    />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormCheckbox
                        label="Master Application Complete"
                        name="masterAppComplete"
                        checked={formData.masterAppComplete}
                        onChange={onChange}
                    />
                    <FormCheckbox
                        label="Resume Complete"
                        name="resumeComplete"
                        checked={formData.resumeComplete}
                        onChange={onChange}
                    />
                </div>
            </GlassCard>

            <GlassCard className="p-6">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Readiness & Barriers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormCheckbox label="Interview Skills Ready" name="interviewSkills" checked={formData.interviewSkills} onChange={onChange} />
                    <FormCheckbox label="Job Search Assistance Needed" name="jobSearchAssistance" checked={formData.jobSearchAssistance} onChange={onChange} />
                    <FormCheckbox label="Transportation Assistance Needed" name="transportationAssistance" checked={formData.transportationAssistance} onChange={onChange} />
                    <FormCheckbox label="Childcare Assistance Needed" name="childcareAssistance" checked={formData.childcareAssistance} onChange={onChange} />
                    <FormCheckbox label="Housing Assistance Needed" name="housingAssistance" checked={formData.housingAssistance} onChange={onChange} />
                </div>
            </GlassCard>
        </div>
    );
};
