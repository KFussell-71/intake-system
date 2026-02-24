import React, { useState } from 'react';
import { MedicalData } from '../../../intakeTypes';
import { GlassCard } from '@/components/ui/GlassCard';
import { Wine, Cigarette, AlertTriangle } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { FormCheckbox } from '@/features/intake/components/FormCheckbox';
import { motion } from 'framer-motion';

interface Props {
    formData: MedicalData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SubstanceUseSection: React.FC<Props> = ({ formData, onChange }) => {
    const [activeTab, setActiveTab] = useState<'tobacco' | 'alcohol' | 'drugs'>('tobacco');

    // Helper for multi-select checkboxes
    const handleMultiSelect = (field: keyof MedicalData, value: string, checked: boolean) => {
        const current = (formData[field] as string[]) || [];
        const updated = checked
            ? [...current, value]
            : current.filter(item => item !== value);

        onChange({
            target: { name: field, value: updated }
        } as any);
    };

    return (
        <GlassCard className="p-0 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Substance Use
                </h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                            checked={
                                formData.tobaccoUse === false &&
                                formData.alcoholHistory === false &&
                                formData.alcoholCurrent === false &&
                                formData.drugHistory === false &&
                                formData.drugCurrent === false &&
                                formData.substanceComments === 'Patient denies all substance use history.'
                            }
                            onChange={(e) => {
                                if (e.target.checked) {
                                    // Clear all fields
                                    const updates: any = {
                                        tobaccoUse: false,
                                        alcoholHistory: false,
                                        alcoholCurrent: false,
                                        drugHistory: false,
                                        drugCurrent: false,

                                        // Reset details
                                        tobaccoDuration: '',
                                        tobaccoQuitInterest: '',
                                        tobaccoProducts: [],

                                        alcoholFrequency: '',
                                        alcoholQuitInterest: '',
                                        alcoholProducts: [],
                                        alcoholPriorTx: false,
                                        alcoholPriorTxDetails: '',
                                        alcoholPriorTxDuration: '',

                                        drugFrequency: '',
                                        drugQuitInterest: '',
                                        drugProducts: [],
                                        drugPriorTx: false,
                                        drugPriorTxDetails: '',

                                        substanceComments: 'Patient denies all substance use history.'
                                    };

                                    // Batch update - usually we only have one onChange, so we iterate
                                    // This is a bit hacky with the current props interface, assuming parent handles shallow merge
                                    // Actually useIntakeForm hook only handles single field change.
                                    // We need to support batch updates or fire multiple events.
                                    // Since we can't change the hook interface easily right now without breaking `IntakeWizard` props pass-through,
                                    // We will rely on checking the implementation of `handleInputChange` in `useIntakeForm`.
                                    // Step 8507 shows line 231: setFormData(prev => ({ ...prev, [name]: ... }))
                                    // It only accepts name/value. We can't batch update via strict `onChange` unless we cheat.
                                    // Cheat: Call onChange for each field or special 'batch' handling if we modified hook.
                                    // Better plan: Assume we can pass a special event or just use `substanceComments` as a flag if we can't batch.
                                    // Actually, let's just make the UI show 'Denied' and set the main flags.
                                    // We will iterate keys and fire onChange for each critical one. 

                                    Object.entries(updates).forEach(([key, val]) => {
                                        onChange({ target: { name: key, value: val, type: typeof val === 'boolean' ? 'checkbox' : 'text', checked: val } } as any);
                                    });
                                } else {
                                    // Unchecked - allow editing again
                                    onChange({ target: { name: 'substanceComments', value: '' } } as any);
                                }
                            }}
                        />
                        Mark All as Denied
                    </label>
                </div>
            </div>

            {/* Only show tabs if NOT fully denied (simple heuristic check) */}
            {!(formData.substanceComments === 'Patient denies all substance use history.') && (
                <>
                    <div className="flex border-b border-slate-100 dark:border-white/5">
                        {[
                            { id: 'tobacco', label: 'Tobacco/Nicotine', icon: Cigarette },
                            { id: 'alcohol', label: 'Alcohol', icon: Wine },
                            { id: 'drugs', label: 'Drugs', icon: AlertTriangle },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-primary border-b-2 border-primary'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 min-h-[400px]">
                        {/* Tobacco */}
                        {activeTab === 'tobacco' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormCheckbox label="Current User?" name="tobaccoUse" checked={formData.tobaccoUse} onChange={onChange} />
                                </div>
                                {formData.tobaccoUse && (
                                    <>
                                        <ElegantTextarea label="How long?" name="tobaccoDuration" value={formData.tobaccoDuration} onChange={onChange} rows={1} />
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-600">Want to quit?</label>
                                            <select
                                                name="tobaccoQuitInterest"
                                                value={formData.tobaccoQuitInterest}
                                                onChange={onChange}
                                                className="w-full rounded-md border-slate-200 bg-white"
                                            >
                                                <option value="">Select...</option>
                                                <option value="No">No, does not want to quit</option>
                                                <option value="Yes">Yes, wants to quit</option>
                                                <option value="Ready">Yes, and is ready to quit</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-600">Product Used</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Cigarettes', 'Cigars/pipe', 'Vape', 'Chewing tobacco', 'Patch', 'Gum'].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2"><input type="checkbox" checked={(formData.tobaccoProducts || []).includes(opt)} onChange={(e) => handleMultiSelect('tobaccoProducts', opt, e.target.checked)} /> <span className="text-sm">{opt}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Alcohol */}
                        {activeTab === 'alcohol' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormCheckbox label="History of Abuse?" name="alcoholHistory" checked={formData.alcoholHistory} onChange={onChange} />
                                    <FormCheckbox label="Current Drinker?" name="alcoholCurrent" checked={formData.alcoholCurrent} onChange={onChange} />
                                </div>

                                <ElegantTextarea label="Frequency & Amount" name="alcoholFrequency" value={formData.alcoholFrequency} onChange={onChange} placeholder="e.g. Daily, 2 glasses" rows={1} />

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">Want to quit?</label>
                                    <select name="alcoholQuitInterest" value={formData.alcoholQuitInterest} onChange={onChange} className="w-full rounded-md border-slate-200 bg-white">
                                        <option value="">Select...</option>
                                        <option value="No">No, does not want to quit</option>
                                        <option value="Yes">Yes, wants to quit</option>
                                        <option value="Ready">Yes, and is ready to quit</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">Product Used</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Beer', 'Wine', 'Wine cooler', 'Liquor', 'Other'].map(opt => (
                                            <label key={opt} className="flex items-center gap-2"><input type="checkbox" checked={(formData.alcoholProducts || []).includes(opt)} onChange={(e) => handleMultiSelect('alcoholProducts', opt, e.target.checked)} /> <span className="text-sm">{opt}</span></label>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <FormCheckbox label="Ever received help for alcohol abuse?" name="alcoholPriorTx" checked={formData.alcoholPriorTx} onChange={onChange} />
                                    {formData.alcoholPriorTx && (
                                        <div className="mt-2 grid grid-cols-1 gap-2">
                                            <ElegantTextarea label="Describe Help" name="alcoholPriorTxDetails" value={formData.alcoholPriorTxDetails} onChange={onChange} rows={1} />
                                            <ElegantTextarea label="Duration" name="alcoholPriorTxDuration" value={formData.alcoholPriorTxDuration} onChange={onChange} rows={1} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Drugs */}
                        {activeTab === 'drugs' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormCheckbox label="History of Abuse?" name="drugHistory" checked={formData.drugHistory} onChange={onChange} />
                                    <FormCheckbox label="Current User?" name="drugCurrent" checked={formData.drugCurrent} onChange={onChange} />
                                </div>

                                <ElegantTextarea label="Frequency & Amount" name="drugFrequency" value={formData.drugFrequency} onChange={onChange} placeholder="e.g. Daily, 2 joints" rows={1} />

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">Want to quit?</label>
                                    <select name="drugQuitInterest" value={formData.drugQuitInterest} onChange={onChange} className="w-full rounded-md border-slate-200 bg-white">
                                        <option value="">Select...</option>
                                        <option value="No">No, does not want to quit</option>
                                        <option value="Yes">Yes, wants to quit</option>
                                        <option value="Ready">Yes, and is ready to quit</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">Drugs Used</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Amphetamines', 'Barbiturates', 'Benzodiazepines', 'Cocaine/crack', 'Hallucinogens', 'Heroine', 'Inhalants', 'Marijuana', 'Opiates', 'Prescription medication'].map(opt => (
                                            <label key={opt} className="flex items-center gap-2"><input type="checkbox" checked={(formData.drugProducts || []).includes(opt)} onChange={(e) => handleMultiSelect('drugProducts', opt, e.target.checked)} /> <span className="text-sm">{opt}</span></label>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <FormCheckbox label="Ever received help for drug abuse?" name="drugPriorTx" checked={formData.drugPriorTx} onChange={onChange} />
                                    {formData.drugPriorTx && (
                                        <div className="mt-2">
                                            <ElegantTextarea label="How long?" name="drugPriorTxDetails" value={formData.drugPriorTxDetails} onChange={onChange} rows={1} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 mt-4">
                                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Clinical Analysis</h4>
                                    <ElegantTextarea
                                        label="Impact on Employment (Functional Limitations)"
                                        name="substanceEmploymentImpact"
                                        value={formData.substanceEmploymentImpact}
                                        onChange={onChange}
                                        rows={2}
                                        placeholder="Describe how use affects attendance, safety, or performance..."
                                    />
                                </div>
                                <ElegantTextarea label="Additional Substance Comments" name="substanceComments" value={formData.substanceComments} onChange={onChange} rows={2} />
                            </motion.div>
                        )}
                    </div>
                </>
            )}
        </GlassCard>
    );
};
