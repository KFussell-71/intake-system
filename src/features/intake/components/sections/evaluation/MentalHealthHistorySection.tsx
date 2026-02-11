import React from 'react';
import { MedicalData } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { Brain, Pill } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { FormCheckbox } from '@/features/intake/components/FormCheckbox';

interface Props {
    formData: MedicalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const MentalHealthHistorySection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Brain className="w-5 h-5 text-primary" />
                Mental Health History
            </h3>

            <div className="space-y-6">

                {/* General History */}
                <div className="space-y-3">
                    <FormCheckbox
                        label="Does the individual have any history of emotional or mental issues?"
                        name="mhHistory"
                        checked={formData.mhHistory}
                        onChange={onChange}
                    />
                    {formData.mhHistory && (
                        <div className="pl-6">
                            <ElegantTextarea
                                label="Details"
                                name="mhHistoryDetails"
                                value={formData.mhHistoryDetails}
                                onChange={onChange}
                                placeholder="Please explain..."
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* Professional Help */}
                <div className="space-y-3">
                    <FormCheckbox
                        label="Seen a mental health professional?"
                        name="mhPriorCounseling"
                        checked={formData.mhPriorCounseling}
                        onChange={onChange}
                    />
                    {formData.mhPriorCounseling && (
                        <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ElegantTextarea
                                label="Professional's Name/Details"
                                name="mhPriorCounselingDetails"
                                value={formData.mhPriorCounselingDetails}
                                onChange={onChange}
                                rows={2}
                            />
                            <ElegantTextarea
                                label="Approximate Dates"
                                name="mhPriorCounselingDates"
                                value={formData.mhPriorCounselingDates}
                                onChange={onChange}
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* Diagnosis */}
                <div className="space-y-3">
                    <FormCheckbox
                        label="Previous mental health diagnosis?"
                        name="mhPriorDiagnosis"
                        checked={formData.mhPriorDiagnosis}
                        onChange={onChange}
                    />
                    {formData.mhPriorDiagnosis && (
                        <div className="pl-6">
                            <ElegantTextarea
                                label="Diagnosis Details"
                                name="mhPriorDiagnosisDetails"
                                value={formData.mhPriorDiagnosisDetails}
                                onChange={onChange}
                                placeholder="What was the diagnosis?"
                                rows={1}
                            />
                        </div>
                    )}
                </div>

                {/* Helpful Activities */}
                <ElegantTextarea
                    label="What therapies/activities helped in the past?"
                    name="mhPriorHelpfulActivities"
                    value={formData.mhPriorHelpfulActivities}
                    onChange={onChange}
                    rows={2}
                />

                {/* Medications */}
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/10">
                    <h4 className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        <Pill className="w-4 h-4" /> Psychotropic Medications
                    </h4>
                    <FormCheckbox
                        label="Has taken prescription meds for mental health?"
                        name="mhPriorMeds"
                        checked={formData.mhPriorMeds}
                        onChange={onChange}
                    />
                    {formData.mhPriorMeds && (
                        <div className="mt-3">
                            <ElegantTextarea
                                label="Medication List"
                                name="mhPriorMedsDetails"
                                value={formData.mhPriorMedsDetails}
                                onChange={onChange}
                                placeholder="Name, Start/Stop dates, Effectiveness..."
                                rows={3}
                            />
                        </div>
                    )}
                </div>

            </div>
        </GlassCard>
    );
};
