'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Flag, Star, Trophy } from 'lucide-react';

interface Milestone {
    id: string;
    milestone_name: string;
    completion_date: string | null;
    is_completed: boolean;
}

interface Props {
    milestones: Milestone[];
}

export const ClientTimeline: React.FC<Props> = ({ milestones }) => {
    // Generate some default milestones if none exist, or combine with actuals
    const allMilestones = [
        { name: 'Initial Intake', icon: <Target className="w-4 h-4" />, color: 'blue' },
        { name: 'Service Plan Signed', icon: <Flag className="w-4 h-4" />, color: 'indigo' },
        { name: 'Job Readiness Training', icon: <Star className="w-4 h-4" />, color: 'purple' },
        { name: 'Placement Achieved', icon: <Trophy className="w-4 h-4" />, color: 'amber' }
    ];

    return (
        <div className="relative space-y-8 pl-4">
            {/* Vertical Line */}
            <div className="absolute left-9 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />

            {allMilestones.map((m, idx) => {
                const isCompleted = idx === 0 || milestones.some(sm => sm.milestone_name.toLowerCase().includes(m.name.toLowerCase()));

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative flex items-center gap-6"
                    >
                        {/* Milestone dot */}
                        <div className={`
                            relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm
                            ${isCompleted
                                ? 'bg-primary text-white scale-110 shadow-primary/20'
                                : 'bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-white/5'}
                        `}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : m.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <h4 className={`font-bold transition-colors ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                {m.name}
                            </h4>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                {isCompleted ? 'Completed' : 'Upcoming Milestone'}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
