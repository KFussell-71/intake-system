'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { X, Gavel, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { intakeController } from '@/controllers/IntakeController';

interface EligibilityDecisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    intakeId: string | null;
    onSuccess: (status: string) => void;
}

export function EligibilityDecisionModal({ isOpen, onClose, intakeId, onSuccess }: EligibilityDecisionModalProps) {
    const [decision, setDecision] = useState<'eligible' | 'ineligible' | ''>('');
    const [rationale, setRationale] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!decision || !rationale) {
            setError('Please provide both a decision and a detailed rationale.');
            return;
        }
        if (!intakeId) {
            setError('No intake ID found. Please save as draft first.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        const result = await intakeController.finalizeEligibility(intakeId, { decision, rationale });

        if (result.success) {
            onSuccess(decision);
            onClose();
        } else {
            setError(result.error || 'Failed to finalize determination.');
        }
        setIsSubmitting(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="w-full max-w-lg pointer-events-auto">
                            <GlassCard className="border-2 border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                                            <Gavel className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Eligibility Determination</h2>
                                            <p className="text-sm text-slate-500">Legal Binding Event</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-sm text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                        <p>
                                            This action is irreversible. It will officially update the intake status
                                            and timestamp the decision for audit purposes.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setDecision('eligible')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${decision === 'eligible'
                                                    ? 'border-green-500 bg-green-500/10 text-green-600'
                                                    : 'border-slate-100 dark:border-white/5 hover:border-green-500/50'
                                                }`}
                                        >
                                            <span className="font-bold">Eligible</span>
                                            <span className="text-xs opacity-70">Approve for Services</span>
                                        </button>
                                        <button
                                            onClick={() => setDecision('ineligible')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${decision === 'ineligible'
                                                    ? 'border-red-500 bg-red-500/10 text-red-600'
                                                    : 'border-slate-100 dark:border-white/5 hover:border-red-500/50'
                                                }`}
                                        >
                                            <span className="font-bold">Ineligible</span>
                                            <span className="text-xs opacity-70">Deny Services</span>
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Clinical Rationale</label>
                                        <textarea
                                            value={rationale}
                                            onChange={(e) => setRationale(e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Cite specific regulations or clinical findings..."
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-500 font-medium">{error}</p>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <ActionButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                                            Cancel
                                        </ActionButton>
                                        <ActionButton
                                            onClick={handleSubmit}
                                            isLoading={isSubmitting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            icon={<Gavel className="w-4 h-4" />}
                                        >
                                            Submit Determination
                                        </ActionButton>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
