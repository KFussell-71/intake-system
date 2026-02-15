'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { IntakeTask, updateTaskStatusAction, createTaskAction } from '@/app/actions/taskActions';
import { Button } from '@/components/ui/button';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { toast } from 'sonner';

interface Props {
    intakeId: string;
    isOpen: boolean;
    onToggle: () => void;
}

export const IntakeTaskSidebar: React.FC<Props> = ({ intakeId, isOpen, onToggle }) => {
    const [tasks, setTasks] = useState<IntakeTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');

    // Removed incorrect createClient call, using imported instance directly

    useEffect(() => {
        const fetchTasks = async () => {
            const { data } = await supabase
                .from('intake_tasks')
                .select('*')
                .eq('intake_id', intakeId)
                .order('created_at', { ascending: true });

            if (data) setTasks(data as any);
            setLoading(false);
        };

        if (intakeId) fetchTasks();

        // Realtime Subscription (Robust)
        let channel: any = null;
        try {
            channel = supabase
                .channel('intake_tasks_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'intake_tasks', filter: `intake_id=eq.${intakeId}` },
                    (payload) => {
                        console.log('Realtime task update:', payload);
                        fetchTasks();
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // console.log('Tasks subscription active');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.warn('Realtime subscription error for tasks');
                    }
                });
        } catch (e) {
            console.warn('Realtime subscription failed (WebSocket unavailable?)', e);
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [intakeId]);

    const handleToggleStatus = async (task: IntakeTask) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        // Optimistic Update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        const result = await updateTaskStatusAction(task.id, newStatus, intakeId);
        if (!result.success) {
            toast.error('Failed to update task');
            // Revert
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
        }
    };

    const handleCreate = async () => {
        if (!newItemTitle.trim()) return;

        const tempId = 'temp-' + Date.now();
        const optimisticTask: any = {
            id: tempId,
            title: newItemTitle,
            status: 'pending',
            task_type: 'manual_action',
            priority: 'medium',
            created_at: new Date().toISOString()
        };

        setTasks(prev => [...prev, optimisticTask]);
        setNewItemTitle('');

        const result = await createTaskAction({
            intake_id: intakeId,
            title: optimisticTask.title,
            task_type: 'manual_action',
            status: 'pending',
            priority: 'medium'
        });

        if (!result.success) {
            toast.error('Failed to create task');
            setTasks(prev => prev.filter(t => t.id !== tempId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Workflow Rules
                </h3>
                <button onClick={onToggle} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${task.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <button onClick={() => handleToggleStatus(task)} className="mt-0.5">
                            {task.status === 'completed' ?
                                <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                            }
                        </button>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                {task.title}
                            </p>
                            {task.due_date && <span className="text-xs text-orange-500 block mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No active tasks.
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                    <input
                        className="flex-1 text-sm border rounded px-2 py-1"
                        placeholder="Add new task..."
                        value={newItemTitle}
                        onChange={e => setNewItemTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <Button size="sm" onClick={handleCreate}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
