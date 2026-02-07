'use client';

import React, { useState, useCallback } from 'react';
import { FileSignature, AlertTriangle, Building2, User, Calendar, FileText, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { ActionButton } from '@/components/ui/ActionButton';
import { HIPAAAuthorizationData, initialHIPAAData } from '../types/hipaaRelease';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    clientData?: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        medicalRecordNumber?: string;
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        assessmentDate?: string;
    };
    onSubmit?: (data: HIPAAAuthorizationData) => void;
    onCancel?: () => void;
}

export const HIPAAAuthorizationForm: React.FC<Props> = ({ clientData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<HIPAAAuthorizationData>(() => ({
        ...initialHIPAAData,
        patientFirstName: clientData?.firstName || '',
        patientLastName: clientData?.lastName || '',
        dateOfBirth: clientData?.dateOfBirth || '',
        medicalRecordNumber: clientData?.medicalRecordNumber || '',
        streetAddress: clientData?.address || '',
        city: clientData?.city || '',
        state: clientData?.state || '',
        postalCode: clientData?.postalCode || '',
        dateOfInitialAssessment: clientData?.assessmentDate || '',
        formId: uuidv4(),
        createdAt: new Date().toISOString(),
    }));

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            updatedAt: new Date().toISOString(),
        }));
    }, []);

    const handleSignatureChange = useCallback((dataUrl: string) => {
        setFormData(prev => ({
            ...prev,
            signatureDataUrl: dataUrl,
            signatureDate: dataUrl ? new Date().toISOString() : '',
            updatedAt: new Date().toISOString(),
        }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.signatureDataUrl) {
            alert('Please provide a signature before submitting.');
            return;
        }
        onSubmit?.(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="text-center border-b-2 border-primary pb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Authorization for Release of Health Information
                    </h1>
                </div>
                <p className="text-sm text-slate-500">
                    In accordance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA)
                </p>
            </div>

            {/* Patient Information Header */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    <User className="w-5 h-5" /> Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ElegantInput label="First Name" name="patientFirstName" value={formData.patientFirstName} onChange={handleChange} required />
                    <ElegantInput label="Last Name" name="patientLastName" value={formData.patientLastName} onChange={handleChange} required />
                    <ElegantInput label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                    <ElegantInput label="Medical Record Number" name="medicalRecordNumber" value={formData.medicalRecordNumber} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="md:col-span-2">
                        <ElegantInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleChange} />
                    </div>
                    <ElegantInput label="City" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <ElegantInput label="State" name="state" value={formData.state} onChange={handleChange} />
                    <ElegantInput label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                    <div className="col-span-2">
                        <ElegantInput label="Date of Initial Assessment" name="dateOfInitialAssessment" type="date" value={formData.dateOfInitialAssessment} onChange={handleChange} />
                    </div>
                </div>
            </GlassCard>

            {/* HIPAA Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200 mb-3">
                    <AlertTriangle className="w-5 h-5" /> Important HIPAA Notice
                </h3>
                <div className="text-sm text-amber-900 dark:text-amber-100 space-y-2">
                    <p><strong>1.</strong> This authorization may include disclosure of information relating to <strong>ALCOHOL and DRUG ABUSE, MENTAL HEALTH TREATMENT</strong> (except psychotherapy notes), and <strong>CONFIDENTIAL HIV-RELATED INFORMATION</strong> only if you initial the appropriate boxes below.</p>
                    <p><strong>2.</strong> If authorizing release of HIV-related, alcohol, drug treatment, or mental health information, the recipient is prohibited from redisclosing without your authorization unless permitted by law.</p>
                    <p><strong>3.</strong> You have the right to revoke this authorization at any time in writing.</p>
                    <p><strong>4.</strong> Signing this authorization is voluntary. Treatment, payment, or eligibility will not be conditioned upon signing.</p>
                    <p><strong>5.</strong> Information disclosed may be redisclosed by the recipient and may no longer be protected by federal or state law.</p>
                    <p><strong>6.</strong> This authorization does not authorize discussion of your health information with anyone other than specified in Item 9(d).</p>
                </div>
            </div>

            {/* Item 7: Provider Info */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    <Building2 className="w-5 h-5" /> 7. Health Provider Releasing Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <ElegantInput label="Provider/Facility Name" name="providerName" value={formData.providerName} onChange={handleChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <ElegantInput label="Address" name="providerAddress" value={formData.providerAddress} onChange={handleChange} />
                    </div>
                    <ElegantInput label="City" name="providerCity" value={formData.providerCity} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElegantInput label="State" name="providerState" value={formData.providerState} onChange={handleChange} />
                        <ElegantInput label="ZIP" name="providerZip" value={formData.providerZip} onChange={handleChange} />
                    </div>
                    <ElegantInput label="Phone" name="providerPhone" value={formData.providerPhone} onChange={handleChange} />
                </div>
            </GlassCard>

            {/* Item 8: Recipient Info */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    <Building2 className="w-5 h-5" /> 8. Recipient of Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <ElegantInput label="Name/Organization" name="recipientName" value={formData.recipientName} onChange={handleChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <ElegantInput label="Address" name="recipientAddress" value={formData.recipientAddress} onChange={handleChange} />
                    </div>
                    <ElegantInput label="City" name="recipientCity" value={formData.recipientCity} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElegantInput label="State" name="recipientState" value={formData.recipientState} onChange={handleChange} />
                        <ElegantInput label="ZIP" name="recipientZip" value={formData.recipientZip} onChange={handleChange} />
                    </div>
                </div>
            </GlassCard>

            {/* Item 9(a): Record Types */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    <FileText className="w-5 h-5" /> 9(a). Medical Records to be Released
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        {[
                            { value: 'entire', label: 'Entire Medical Record (histories, office notes, test results, films, billing, insurance)' },
                            { value: 'specific_dates', label: 'Specific Date Range' },
                            { value: 'other', label: 'Other (specify below)' },
                        ].map(option => (
                            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="recordType"
                                    value={option.value}
                                    checked={formData.recordType === option.value}
                                    onChange={handleChange}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{option.label}</span>
                            </label>
                        ))}
                    </div>

                    {formData.recordType === 'specific_dates' && (
                        <div className="grid grid-cols-2 gap-4 pl-8 border-l-2 border-primary/20">
                            <ElegantInput label="From Date" name="specificDatesFrom" type="date" value={formData.specificDatesFrom} onChange={handleChange} />
                            <ElegantInput label="To Date" name="specificDatesTo" type="date" value={formData.specificDatesTo} onChange={handleChange} />
                        </div>
                    )}

                    {formData.recordType === 'other' && (
                        <div className="pl-8 border-l-2 border-primary/20">
                            <ElegantTextarea label="Specify Records" name="otherRecordsDescription" value={formData.otherRecordsDescription} onChange={handleChange} rows={2} />
                        </div>
                    )}

                    {/* Special Categories */}
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-800 dark:text-red-200 mb-3">
                            Special Categories (Initial to Include)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { name: 'includeAlcoholDrug', label: 'Alcohol/Drug Treatment' },
                                { name: 'includeMentalHealth', label: 'Mental Health Information' },
                                { name: 'includeHIV', label: 'HIV-Related Information' },
                                { name: 'includeGenetic', label: 'Genetic Testing' },
                            ].map(cat => (
                                <label key={cat.name} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name={cat.name}
                                        checked={(formData as any)[cat.name]}
                                        onChange={handleChange}
                                        className="rounded text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </label>
                            ))}
                        </div>
                        <ElegantInput label="Other Categories" name="otherCategories" value={formData.otherCategories} onChange={handleChange} className="mt-3" />
                    </div>
                </div>
            </GlassCard>

            {/* Item 9(b-d): Discussion Authorization */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    9(b-d). Authorization to Discuss Health Information
                </h2>
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                        type="checkbox"
                        name="authorizeDiscussion"
                        checked={formData.authorizeDiscussion}
                        onChange={handleChange}
                        className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">I authorize discussion of my health information with my attorney or governmental agency</span>
                </label>

                {formData.authorizeDiscussion && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8 border-l-2 border-primary/20">
                        <ElegantInput label="9(c). Healthcare Provider Name" name="healthcareProviderName" value={formData.healthcareProviderName} onChange={handleChange} />
                        <ElegantInput label="9(d). Attorney/Firm or Agency" name="attorneyOrAgencyName" value={formData.attorneyOrAgencyName} onChange={handleChange} />
                    </div>
                )}
            </GlassCard>

            {/* Item 10: Reason */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    10. Reason for Release
                </h2>
                <div className="space-y-3">
                    {[
                        { value: 'personal', label: 'Personal Use' },
                        { value: 'other', label: 'Other (specify)' },
                    ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="releaseReason"
                                value={option.value}
                                checked={formData.releaseReason === option.value}
                                onChange={handleChange}
                            />
                            <span className="text-sm">{option.label}</span>
                        </label>
                    ))}
                    {formData.releaseReason === 'other' && (
                        <div className="pl-8">
                            <ElegantInput label="Specify Reason" name="releaseReasonOther" value={formData.releaseReasonOther} onChange={handleChange} />
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Item 11: Expiration */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4 text-primary">11. Expiration Date</h2>
                <ElegantInput label="This authorization expires on" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleChange} required />
            </GlassCard>

            {/* Items 12-13: Representative */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold mb-4 text-primary">12-13. If Not the Patient</h2>
                <p className="text-sm text-slate-500 mb-4">Complete only if signing on behalf of the patient.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ElegantInput label="Representative Name" name="representativeName" value={formData.representativeName} onChange={handleChange} />
                    <ElegantInput label="Authority to Sign" name="representativeAuthority" value={formData.representativeAuthority} onChange={handleChange} placeholder="e.g. Legal Guardian, Power of Attorney" />
                </div>
            </GlassCard>

            {/* Signature Section */}
            <GlassCard className="p-6 border-2 border-primary">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                    <FileSignature className="w-5 h-5" /> Signature
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    All items on this form have been completed and my questions about this form have been answered.
                    I have been provided a copy of the form.
                </p>
                <SignaturePad
                    onSignatureChange={handleSignatureChange}
                    label="Signature of Patient or Authorized Representative"
                    required
                />
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Date Signed</label>
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                            {formData.signatureDate ? new Date(formData.signatureDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
                {onCancel && (
                    <ActionButton type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </ActionButton>
                )}
                <ActionButton type="submit" disabled={!formData.signatureDataUrl}>
                    Submit Signed Authorization
                </ActionButton>
            </div>
        </form>
    );
};
