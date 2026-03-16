import React, { useState } from 'react';
import { Menu, X, User, Stethoscope, Target, GraduationCap, Briefcase, FileCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    currentStep: number;
    onJump: (step: number) => void;
    validationErrors: Record<string, string>;
}

const steps = [
    { title: 'Identity', icon: User },
    { title: 'Evaluation', icon: Stethoscope },
    { title: 'Goals', icon: Target },
    { title: 'Prep', icon: GraduationCap },
    { title: 'Placement', icon: Briefcase },
    { title: 'Review', icon: FileCheck },
];

export const MobileIntakeNav: React.FC<Props> = ({ currentStep, onJump, validationErrors }) => {
    const [isOpen, setIsOpen] = useState(false);

    const hasError = (index: number) => {
        // Simple mapping, logic duplicated from Sidebar for now
        if (index === 0 && (validationErrors.clientName || validationErrors.ssnLastFour)) return true;
        if (index === 1 && validationErrors.consentToRelease) return true;
        return false;
    };

    return (
        <>
            {/* Fixed Bottom Bar Trigger */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 lg:hidden z-40 flex items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Current Section</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{steps[currentStep]?.title || 'Intake'}</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold shadow-lg"
                >
                    <Menu className="w-4 h-4" />
                    Quick Jump
                </button>
            </div>

            {/* Bottom Sheet Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-white/10 shadow-2xl z-50 lg:hidden max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Navigation</h3>
                                    <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {steps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const error = hasError(idx);
                                        const active = currentStep === idx;
                                        const completed = currentStep > idx;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    onJump(idx);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${active
                                                        ? 'bg-primary/10 border border-primary/20'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg ${active ? 'bg-primary text-white' : 'bg-white dark:bg-slate-700 text-slate-500'}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className={`font-bold ${active ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {step.title}
                                                    </div>
                                                    {error && <div className="text-xs text-red-500 font-medium">Missing required fields</div>}
                                                </div>
                                                <ChevronRight className={`w-5 h-5 ${active ? 'text-primary' : 'text-slate-300'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="pb-8 text-center text-xs text-slate-400">
                                    Draft saved automatically.
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
