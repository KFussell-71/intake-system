import React from 'react';
import { Briefcase } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { VocationalData } from '@/features/intake/intakeTypes';

interface Props {
    formData: VocationalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PlacementPanel: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Job Placement Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ElegantInput
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={onChange}
                        placeholder="Employer name"
                        enableDictation
                    />
                    <ElegantInput
                        label="Job Title"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={onChange}
                        placeholder="e.g. Sales Associate"
                        enableDictation
                    />
                    <ElegantInput
                        label="Wage / Salary"
                        name="wage"
                        value={formData.wage}
                        onChange={onChange}
                        placeholder="e.g. $20/hr"
                    />
                    <ElegantInput
                        label="Hours Per Week"
                        name="hoursPerWeek"
                        value={formData.hoursPerWeek}
                        onChange={onChange}
                        placeholder="e.g. 40"
                    />
                    <ElegantInput
                        label="Placement Date"
                        name="placementDate"
                        value={formData.placementDate}
                        onChange={onChange}
                        type="date"
                    />
                    <ElegantInput
                        label="Probation Ends"
                        name="probationEnds"
                        value={formData.probationEnds}
                        onChange={onChange}
                        type="date"
                    />
                    <ElegantInput
                        label="Supervisor Name"
                        name="supervisorName"
                        value={formData.supervisorName}
                        onChange={onChange}
                    />
                    <ElegantInput
                        label="Supervisor Phone"
                        name="supervisorPhone"
                        value={formData.supervisorPhone}
                        onChange={onChange}
                    />
                </div>
                <div className="mt-6">
                    <ElegantTextarea
                        label="Benefits & Transportation"
                        name="benefits"
                        value={formData.benefits}
                        onChange={onChange}
                        placeholder="Describe benefits, commute details, etc..."
                        rows={3}
                        enableDictation
                    />
                </div>
            </GlassCard>
        </div>
    );
};
