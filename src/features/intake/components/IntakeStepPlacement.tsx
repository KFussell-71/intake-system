import React from 'react';
import { Briefcase } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepPlacement: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-primary" />
                Job Placement Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={onChange}
                    placeholder="Employer name"
                />
                <ElegantInput
                    label="Job Title"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={onChange}
                    placeholder="e.g. Sales Associate"
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
    );
};
