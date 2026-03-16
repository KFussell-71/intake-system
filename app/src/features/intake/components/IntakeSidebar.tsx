import React from 'react';
import {
    User, Stethoscope, Target, GraduationCap, Briefcase, FileCheck,
    AlertCircle, CheckCircle2, Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export const IntakeSidebar: React.FC<Props> = ({ currentStep, onJump, validationErrors }) => {
    // Helper to check if a step has errors
    const hasError = (index: number) => {
        if (index === 0 && (validationErrors.clientName || validationErrors.ssnLastFour)) return true;
        if (index === 1 && validationErrors.consentToRelease) return true;
        if (index === 2 && validationErrors.employmentGoals) return true;
        return false;
    };

    return (
        <div className="hidden lg:block w-64 shrink-0 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-2">
                    Quick Navigation
                </h3>
                <div className="space-y-1">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const error = hasError(idx);
                        const active = currentStep === idx;
                        const completed = currentStep > idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => onJump(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <div className={`relative flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : error ? 'text-red-500' : 'text-slate-400'}`} />
                                    {error && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                                    )}
                                </div>
                                <span className={`flex-1 text-left ${active ? 'font-bold' : ''}`}>
                                    {step.title}
                                </span>
                                {completed && !error && !active && (
                                    <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 px-2 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-primary/20" />
                        <span>Current Section</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Requires Attention</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>Draft Mode Active:</strong> You can jump between sections freely. Validation is only strictly enforced upon final submission.
                    </div>
                </div>
            </div>
        </div>
    );
};
