import React from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { AISuccessSuggestions } from './AISuccessSuggestions';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: Record<string, string>;
}

export const IntakeStepReview: React.FC<Props> = ({ formData, onChange, errors = {} }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                Review & Finalize
            </h2>

            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">Please review preceding steps. {Object.keys(errors).length} validation errors found.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Referral Source"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={onChange}
                    placeholder="e.g. Agency name"
                    enableDictation
                />
                <ElegantInput
                    label="Referral Contact"
                    name="referralContact"
                    value={formData.referralContact}
                    onChange={onChange}
                    placeholder="Contact name or phone"
                    enableDictation
                />
            </div>
            <ElegantTextarea
                label="Staff Observations & Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={onChange}
                placeholder="Any other relevant details or next steps..."
                rows={6}
                enableDictation
            />

            <AISuccessSuggestions formData={formData} />
        </div>
    );
};
