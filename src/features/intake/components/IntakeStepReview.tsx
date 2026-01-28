import React from 'react';
import { FileCheck } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepReview: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                Review & Finalize
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Referral Source"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={onChange}
                    placeholder="e.g. Agency name"
                />
                <ElegantInput
                    label="Referral Contact"
                    name="referralContact"
                    value={formData.referralContact}
                    onChange={onChange}
                    placeholder="Contact name or phone"
                />
            </div>
            <ElegantTextarea
                label="Staff Observations & Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={onChange}
                placeholder="Any other relevant details or next steps..."
                rows={6}
            />
        </div>
    );
};
