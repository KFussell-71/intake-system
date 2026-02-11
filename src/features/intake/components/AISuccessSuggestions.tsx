'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Briefcase, GraduationCap, Link2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessSuggestion } from '@/lib/agents/successAssistant';
import { intakeController } from '@/controllers/IntakeController';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
}

export const AISuccessSuggestions: React.FC<Props> = ({ formData }) => {
    const [suggestions, setSuggestions] = useState<SuccessSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const getSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await intakeController.getSuccessSuggestions(formData);
            if (result && result.length > 0) {
                setSuggestions(result);
            } else {
                setError("No suggestions generated. Please try again.");
            }
        } catch (err) {
            setError("Failed to generate suggestions. Please ensure AI service is available.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}
            <button
                onClick={getSuggestions}
                disabled={loading}
                className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
                <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'AI Success Architect is thinking...' : 'Generate AI Career Roadmap'}
            </button>

            <AnimatePresence>
                {suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 grid grid-cols-1 gap-4"
                    >
                        {suggestions.map((s, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm"
                            >
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-2xl flex-shrink-0 ${s.category === 'career' ? 'bg-blue-500/10 text-blue-500' :
                                        s.category === 'training' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {s.category === 'career' ? <Briefcase className="w-5 h-5" /> :
                                            s.category === 'training' ? <GraduationCap className="w-5 h-5" /> :
                                                <Link2 className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {s.title}
                                            <span className="text-[10px] uppercase tracking-tighter px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400">
                                                {s.category}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.description}</p>
                                        <div className="mt-4 flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 cursor-pointer group hover:underline">
                                                <span>Action: {s.action}</span>
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </div>

                                            {s.sourceUrl && (
                                                <a
                                                    href={s.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-100 dark:border-white/5 hover:text-primary transition-colors group"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View Live Source
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
