
'use client';

import { useTraining } from '@/features/training/context/TrainingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Play, X, BookOpen, Video } from 'lucide-react';
import { useState } from 'react';

const GUIDES: Record<string, { title: string, steps: any[], videoUrl?: string }> = {
    'intake-flow': {
        title: 'Intake Process Walkthrough',
        steps: [
            { target: 'step-0', content: 'Start by collecting basic identity information.' },
            { target: 'step-1', content: 'Ensure you have the client consent form signed.' },
            { target: 'compliance-sidebar', content: 'Check this sidebar for mandatory RSA-911 fields.' }
        ],
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
    }
};

export const TrainingOverlay = () => {
    const { isTrainingMode, activeGuide, stopGuide, startGuide } = useTraining();
    const [isOpen, setIsOpen] = useState(false);

    if (!isTrainingMode) return null;

    return (
        <>
            {/* Floating Help Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 z-50 flex items-center gap-2"
            >
                <HelpCircle className="w-6 h-6" />
                <span className="font-bold text-sm">Training Mode</span>
            </motion.button>

            {/* Help Menu */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Training Resources</h2>
                                    <p className="text-slate-500">Select a guide to learn more about the system.</p>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => startGuide('intake-flow')}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600">
                                            <Play className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Intake Walkthrough</h3>
                                            <p className="text-sm text-slate-500">Learn how to process a new client intake from start to finish.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600">
                                            <Video className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">RSA-911 Video Guide</h3>
                                            <p className="text-sm text-slate-500">Watch a comprehensive video on compliance coding.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-500/20 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Supervisor FAQ</h3>
                                            <p className="text-sm text-slate-500">Common questions about reporting and approvals.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Active Guide Overlay (Mock) */}
            {activeGuide && (
                <div className="fixed top-1/4 left-1/4 max-w-xs bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border-2 border-emerald-500 z-[60] animate-in fade-in zoom-in">
                    <h4 className="font-bold mb-2">💡 Guided Tour</h4>
                    <p className="text-sm mb-4">{GUIDES[activeGuide]?.steps[0].content}</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={stopGuide} className="text-xs text-slate-500 hover:text-red-500">End Tour</button>
                        <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">Next</button>
                    </div>
                </div>
            )}
        </>
    );
}
