'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';

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
    // Sort by step_order
    const sortedMilestones = [...milestones].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

    // Determine current step (first non-completed step)
    const currentStepIndex = sortedMilestones.findIndex(m => !m.completion_date);

    // If all completed, current is last + 1 (or handle as "All Done")
    const activeIndex = currentStepIndex === -1 ? sortedMilestones.length : currentStepIndex;

    return (
        <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {sortedMilestones.map((milestone, index) => {
                const isCompleted = !!milestone.completion_date;
                const isActive = index === activeIndex;
                const isPending = !isCompleted && !isActive;

                return (
                    <div key={milestone.id} className="relative">
                        {/* Status Dot */}
                        <div className={`absolute -left-[2.15rem] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 bg-slate-900 ${isCompleted ? 'border-emerald-500 text-emerald-500' :
                                isActive ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' :
                                    'border-slate-700 bg-slate-900'
                            }`}>
                            {isCompleted && <CheckCircle className="w-4 h-4" />}
                            {isActive && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />}
                            {isPending && <Circle className="w-3 h-3 text-slate-700" />}
                        </div>

                        {/* Content Card */}
                        <div className={`transition-all duration-500 ${isActive ? 'opacity-100 transform translate-x-0' :
                                isCompleted ? 'opacity-70' :
                                    'opacity-50'
                            }`}>
                            <h3 className={`text-lg font-semibold ${isCompleted ? 'text-emerald-400' :
                                    isActive ? 'text-blue-400' :
                                        'text-slate-400'
                                }`}>
                                {milestone.milestone_name}
                            </h3>

                            {milestone.description && (
                                <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
                            )}

                            {isCompleted && (
                                <p className="text-xs text-emerald-500/70 mt-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Completed {new Date(milestone.completion_date!).toLocaleDateString()}
                                </p>
                            )}

                            {isActive && (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                    Current Stage
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
