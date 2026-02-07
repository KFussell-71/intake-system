import React from 'react';
import { IntakeFormData, MedicalData } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { Stethoscope, Activity } from 'lucide-react';
import { ElegantTextarea, ElegantInput } from '@/components/ui/ElegantInput';
import { FormCheckbox } from '@/features/intake/components/FormCheckbox';

interface Props {
    // Soft Refactor: Using Pick type to strictly define what this section needs
    formData: MedicalData & Partial<IntakeFormData>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isReadOnly?: boolean;
}

export const MedicalHistorySection: React.FC<Props> = ({ formData, onChange, isReadOnly = false }) => {
    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Stethoscope className="w-5 h-5 text-primary" />
                Medical History
                <div className="flex items-center gap-2 ml-auto">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                            checked={
                                formData.medicalConditionCurrent === false &&
                                formData.medicalMedsCurrent === false &&
                                formData.medicalComments === 'Patient denies history of significant medical conditions.'
                            }
                            disabled={isReadOnly}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    const updates: any = {
                                        medicalConditionCurrent: false,
                                        medicalConditionDescription: '',
                                        medicalPriorHistory: '',
                                        medicalMedsCurrent: false,
                                        medicalMedsDetails: '',
                                        primaryCarePhysician: '',
                                        primaryCarePhysicianContact: '',
                                        medicalComments: 'Patient denies history of significant medical conditions.',
                                        medicalEmploymentImpact: ''
                                    };
                                    Object.entries(updates).forEach(([key, val]) => {
                                        onChange({ target: { name: key, value: val, type: typeof val === 'boolean' ? 'checkbox' : 'text', checked: val } } as any);
                                    });
                                } else {
                                    onChange({ target: { name: 'medicalComments', value: '' } } as any);
                                }
                            }}
                        />
                        Mark All as Denied
                    </label>
                </div>
            </h3>

            {!(formData.medicalComments === 'Patient denies history of significant medical conditions.') && (
                <>

                    <div className="space-y-6">

                        {/* Current Condition */}
                        <div className="space-y-3">
                            <FormCheckbox
                                label="Currently being treated for physical condition?"
                                name="medicalConditionCurrent"
                                checked={formData.medicalConditionCurrent}
                                onChange={onChange}
                                disabled={isReadOnly}
                            />
                            {formData.medicalConditionCurrent && (
                                <div className="pl-6">
                                    <ElegantTextarea
                                        label="Condition Description"
                                        name="medicalConditionDescription"
                                        value={formData.medicalConditionDescription}
                                        onChange={onChange}
                                        rows={2}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Prior History */}
                        <ElegantTextarea
                            label="Prior Illnesses, Operations, Accidents"
                            name="medicalPriorHistory"
                            value={formData.medicalPriorHistory}
                            onChange={onChange}
                            placeholder="List significant history..."
                            rows={3}
                            readOnly={isReadOnly}
                        />

                        {/* Current Meds */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/10">
                            <h4 className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                                <Activity className="w-4 h-4" /> Physical Medications
                            </h4>
                            <FormCheckbox
                                label="Taking prescription meds for physical issues?"
                                name="medicalMedsCurrent"
                                checked={formData.medicalMedsCurrent}
                                onChange={onChange}
                                disabled={isReadOnly}
                            />
                            {formData.medicalMedsCurrent && (
                                <div className="mt-3">
                                    <ElegantTextarea
                                        label="Medication List"
                                        name="medicalMedsDetails"
                                        value={formData.medicalMedsDetails}
                                        onChange={onChange}
                                        placeholder="Medication and frequency..."
                                        rows={3}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                            )}
                        </div>

                        {/* PCP Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ElegantInput
                                label="Primary Care Physician Name"
                                name="primaryCarePhysician"
                                value={formData.primaryCarePhysician}
                                onChange={onChange}
                                readOnly={isReadOnly}
                            />
                            <ElegantTextarea
                                label="PCP Contact Details"
                                name="primaryCarePhysicianContact"
                                value={formData.primaryCarePhysicianContact}
                                onChange={onChange}
                                rows={1}
                                placeholder="Phone/Address"
                                readOnly={isReadOnly}
                            />
                        </div>

                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Clinical Analysis</h4>
                            <ElegantTextarea
                                label="Impact on Employment (Functional Limitations)"
                                name="medicalEmploymentImpact"
                                value={formData.medicalEmploymentImpact}
                                onChange={onChange}
                                rows={3}
                                placeholder="Describe how these medical conditions affect the client's ability to work..."
                                readOnly={isReadOnly}
                            />
                        </div>

                        <ElegantTextarea
                            label="Additional Comments (Medical/Mental)"
                            name="medicalComments"
                            value={formData.medicalComments}
                            onChange={onChange}
                            rows={2}
                            readOnly={isReadOnly}
                        />

                    </div>
                </>
            )}
        </GlassCard>
    );
};
