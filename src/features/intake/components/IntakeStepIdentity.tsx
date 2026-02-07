import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { DocumentVerificationSection } from './DocumentVerificationSection';
import { CounselorRationaleField } from './CounselorRationaleField';

// Sections
import { DemographicsSection } from './sections/DemographicsSection';
import { EmergencyContactSection } from './sections/EmergencyContactSection';
import { FinancialInfoSection } from './sections/FinancialInfoSection';
import { CurrentIssueSection } from './sections/CurrentIssueSection';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: Record<string, string>;
}

export const IntakeStepIdentity: React.FC<Props> = ({ formData, onChange, errors = {} }) => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-primary" />
                Identity & Basic Info
            </h2>

            {/* Core Identity (Sticky/Top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Full Name"
                    name="clientName"
                    value={formData.clientName}
                    onChange={onChange}
                    required
                    placeholder="First Last"
                    enableDictation
                    error={errors.clientName}
                />
                <ElegantInput
                    label="Last 4 of SSN"
                    name="ssnLastFour"
                    value={formData.ssnLastFour}
                    onChange={onChange}
                    placeholder="1234"
                    maxLength={4}
                    required
                    error={errors.ssnLastFour}
                />
                <ElegantInput
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    type="tel"
                    placeholder="(555) 000-0000"
                    error={errors.phone}
                />
                <ElegantInput
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    type="email"
                    placeholder="client@example.com"
                    error={errors.email}
                />
                <div className="md:col-span-2">
                    <ElegantInput
                        label="Physical Address"
                        name="address"
                        value={formData.address}
                        onChange={onChange}
                        placeholder="Street, City, Zip"
                        enableDictation
                        error={errors.address}
                    />
                </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            {/* Demographics */}
            <DemographicsSection formData={formData} onChange={onChange} />

            {/* Emergency Contact */}
            <EmergencyContactSection formData={formData} onChange={onChange} />

            {/* Financial Info */}
            <FinancialInfoSection formData={formData} onChange={onChange} />

            {/* Current Issue */}
            <CurrentIssueSection formData={formData} onChange={onChange} />

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

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-white/5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preferred Contact Method
                </label>
                <div className="flex gap-6">
                    {['Phone', 'Text', 'Email'].map((method) => (
                        <label key={method} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={(formData.preferredContactMethods || []).includes(method)}
                                onChange={(e) => {
                                    const current = formData.preferredContactMethods || [];
                                    const updated = e.target.checked
                                        ? [...current, method]
                                        : current.filter(m => m !== method);
                                    onChange({
                                        target: { name: 'preferredContactMethods', value: updated }
                                    } as any);
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {method}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            <DocumentVerificationSection formData={formData} onChange={onChange} />

            <div className="pt-4">
                <CounselorRationaleField
                    label="Identity Verification"
                    name="counselorObservations"
                    value={formData.counselorObservations || ''}
                    onChange={onChange as any}
                    placeholder="Describe evidence of identity and any discrepancies observed during documentation review..."
                />
            </div>
        </div>
    );
};
