import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepIdentity: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-primary" />
                Identity & Basic Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Full Name"
                    name="clientName"
                    value={formData.clientName}
                    onChange={onChange}
                    required
                    placeholder="First Last"
                />
                <ElegantInput
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    type="tel"
                    placeholder="(555) 000-0000"
                />
                <ElegantInput
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    type="email"
                    placeholder="client@example.com"
                />
                <ElegantInput
                    label="Physical Address"
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    placeholder="Street, City, Zip"
                />
            </div>
            <hr className="border-slate-100 dark:border-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Intake Date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={onChange}
                    type="date"
                    required
                />
                <ElegantInput
                    label="Est. Completion Date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={onChange}
                    type="date"
                />
            </div>
        </div>
    );
};
