'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Milestone {
    id: string;
    milestone_name: string;
    description?: string;
    completion_date?: string;
    step_order: number;
}

interface JourneyMapProps {
    milestones: Milestone[];
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ milestones }) => {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    // Sort by step_order
    const sortedMilestones = [...milestones].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

    // Determine current step (first non-completed step)
    const currentStepIndex = sortedMilestones.findIndex(m => !m.completion_date);

    // If all completed, current is last + 1 (or handle as "All Done")
    const activeIndex = currentStepIndex === -1 ? sortedMilestones.length : currentStepIndex;

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Trigger confetti when the active step changes to a completed state (simulation for demo)
    // In a real app, this would trigger based on a prop or specific event.
    // For now, we'll trigger it if the LAST milestone was just completed recently.
    useEffect(() => {
        const lastCompleted = sortedMilestones.filter(m => m.completion_date).pop();
        if (lastCompleted) {
            const completionDate = new Date(lastCompleted.completion_date!);
            const now = new Date();
            // If completed within the last 10 seconds (simulated "just now")
            if (now.getTime() - completionDate.getTime() < 10000) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
    }, [milestones]);

    return (
        <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/50">
            {sortedMilestones.map((milestone, index) => {
                const isCompleted = !!milestone.completion_date;
                const isActive = index === activeIndex;
                const isPending = !isCompleted && !isActive;
                const isExpanded = expandedIds.includes(milestone.id) || isActive;

                return (
                    <motion.div
                        key={milestone.id}
                        className="relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {/* Status Dot */}
                        <motion.div
                            className={`absolute -left-[2.15rem] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-500 z-10 bg-slate-900 ${isCompleted ? 'border-emerald-500 text-emerald-500' :
                                isActive ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                                    'border-slate-700 bg-slate-900'
                                }`}
                            animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
                        >
                            {isCompleted && <CheckCircle className="w-4 h-4" />}
                            {isActive && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            {isPending && <Circle className="w-3 h-3 text-slate-700" />}
                        </motion.div>

                        {/* Content Card */}
                        <motion.div
                            className={`rounded-xl border p-4 transition-all duration-300 cursor-pointer ${isActive
                                    ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/30 shadow-lg shadow-blue-900/10'
                                    : isCompleted
                                        ? 'bg-slate-800/20 border-emerald-500/20 hover:bg-slate-800/40'
                                        : 'bg-transparent border-transparent hover:bg-slate-800/20'
                                }`}
                            onClick={() => toggleExpand(milestone.id)}
                            layout
                        >
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${isCompleted ? 'text-emerald-400' :
                                    isActive ? 'text-blue-400' :
                                        'text-slate-400'
                                    }`}>
                                    {milestone.milestone_name}
                                </h3>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-3">
                                            {milestone.description && (
                                                <p className="text-sm text-slate-300 leading-relaxed">{milestone.description}</p>
                                            )}

                                            {isCompleted && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Completed {new Date(milestone.completion_date!).toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}</span>
                                                </div>
                                            )}

                                            {isActive && (
                                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 animate-pulse">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                    Blocking tasks pending
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                );
            })}
        </div>
    );
};
