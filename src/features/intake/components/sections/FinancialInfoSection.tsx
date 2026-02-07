import React from 'react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../../types/intake';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const FinancialInfoSection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <CreditCard className="w-5 h-5 text-primary" />
                Financial Information
            </h3>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Payment Method for Services</label>
                    <div className="flex flex-wrap gap-4">
                        {['Insurance', 'Self-pay cash', 'Self-pay debit/credit card', 'Other'].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-primary transition-all">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={option}
                                    checked={formData.paymentMethod === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {formData.paymentMethod === 'Insurance' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-primary/5 p-4 rounded-xl border border-primary/10 overflow-hidden"
                        >
                            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Insurance Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ElegantInput
                                    label="Insurance Company"
                                    name="insuranceCompany"
                                    value={formData.insuranceCompany}
                                    onChange={onChange}
                                    placeholder="Provider Name"
                                />
                                <ElegantInput
                                    label="Policy Number"
                                    name="insurancePolicyNumber"
                                    value={formData.insurancePolicyNumber}
                                    onChange={onChange}
                                    placeholder="POLICY-123"
                                />
                                <ElegantInput
                                    label="Group Number"
                                    name="insuranceGroupNumber"
                                    value={formData.insuranceGroupNumber}
                                    onChange={onChange}
                                    placeholder="GROUP-456"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    );
};
