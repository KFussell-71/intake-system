'use client';

import { useState, useEffect } from 'react';
import { CarePlan, CarePlanGoal, CarePlanAction, GoalCategory } from '@/types/case';
import { carePlanService } from '@/services/CarePlanService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Target, CheckCircle2, Circle, ArrowRight, User, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
    caseId: string;
}

export function CarePlanBuilder({ caseId }: Props) {
    const [plan, setPlan] = useState<CarePlan | null>(null);
    const [goals, setGoals] = useState<(CarePlanGoal & { actions: CarePlanAction[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingGoal, setIsCreatingGoal] = useState(false);

    // New Goal State
    const [newGoalDesc, setNewGoalDesc] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('housing');
    const [newGoalDate, setNewGoalDate] = useState('');

    useEffect(() => {
        loadPlan();
    }, [caseId]);

    const loadPlan = async () => {
        try {
            let p = await carePlanService.getPlanByCaseId(caseId);
            if (!p) {
                // Auto-create draft plan if none exists
                p = await carePlanService.createPlan(caseId);
            }
            setPlan(p);

            if (p) {
                const g = await carePlanService.getGoals(p.id);
                setGoals(g);
            }
        } catch (error) {
            console.error('Error loading care plan:', error);
            toast.error('Failed to load care plan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async () => {
        if (!plan || !newGoalDesc) return;
        try {
            const goal = await carePlanService.addGoal(plan.id, {
                description: newGoalDesc,
                category: newGoalCategory,
                target_date: newGoalDate || undefined
            });

            setGoals([...goals, { ...goal, actions: [] }]);
            setNewGoalDesc('');
            setIsCreatingGoal(false);
            toast.success('Goal added');
        } catch (error) {
            toast.error('Failed to add goal');
        }
    };

    const handleAddAction = async (goalId: string, desc: string) => {
        try {
            const action = await carePlanService.addAction(goalId, {
                description: desc,
                assigned_to_role: 'case_worker' // Default
            });

            setGoals(goals.map(g =>
                g.id === goalId
                    ? { ...g, actions: [...g.actions, action] }
                    : g
            ));
            toast.success('Action added');
        } catch (error) {
            toast.error('Failed to add action');
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Care Plan
                </h2>
                <button
                    onClick={() => setIsCreatingGoal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Goal
                </button>
            </div>

            {/* Goal Creation Form */}
            {isCreatingGoal && (
                <GlassCard className="p-4 bg-blue-50/50 border-blue-200">
                    <h3 className="font-medium mb-3">New Goal</h3>
                    <div className="grid gap-4">
                        <textarea
                            value={newGoalDesc}
                            onChange={(e) => setNewGoalDesc(e.target.value)}
                            placeholder="Describe the goal (e.g., Secure stable housing)..."
                            className="w-full p-2 rounded border border-slate-300 text-sm"
                            rows={2}
                        />
                        <div className="flex gap-4">
                            <select
                                value={newGoalCategory}
                                onChange={(e) => setNewGoalCategory(e.target.value as GoalCategory)}
                                className="p-2 rounded border border-slate-300 text-sm"
                            >
                                <option value="housing">Housing</option>
                                <option value="employment">Employment</option>
                                <option value="health">Health</option>
                                <option value="education">Education</option>
                                <option value="legal">Legal</option>
                                <option value="finance">Finance</option>
                                <option value="social">Social</option>
                                <option value="other">Other</option>
                            </select>
                            <input
                                type="date"
                                value={newGoalDate}
                                onChange={(e) => setNewGoalDate(e.target.value)}
                                className="p-2 rounded border border-slate-300 text-sm"
                            />
                            <div className="flex-1" />
                            <button
                                onClick={() => setIsCreatingGoal(false)}
                                className="px-3 py-1 text-slate-500 hover:text-slate-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddGoal}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                                Save Goal
                            </button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Goals List */}
            <div className="grid gap-6">
                {goals.length === 0 && !isCreatingGoal && (
                    <p className="text-center text-slate-500 py-8 italic">No goals defined yet.</p>
                )}

                {goals.map((goal) => (
                    <GlassCard key={goal.id} className="p-0 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                        {goal.category}
                                    </span>
                                    {goal.target_date && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-slate-900">{goal.description}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Goal Status Indicator */}
                                <div className={`w-3 h-3 rounded-full ${goal.status === 'achieved' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-white space-y-3">
                            {goal.actions.map((action) => (
                                <div key={action.id} className="flex items-start gap-3 text-sm group">
                                    <button className="mt-0.5 text-slate-400 hover:text-green-600 transition-colors">
                                        {action.status === 'completed'
                                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            : <Circle className="w-4 h-4" />
                                        }
                                    </button>
                                    <span className={action.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                                        {action.description}
                                    </span>
                                </div>
                            ))}

                            {/* Add Action Input (Simple) */}
                            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50">
                                <Plus className="w-4 h-4 text-slate-400 mt-2" />
                                <input
                                    type="text"
                                    placeholder="Add an action step..."
                                    className="flex-1 bg-transparent text-sm focus:outline-none py-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddAction(goal.id, e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
