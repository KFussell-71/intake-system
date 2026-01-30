'use client';

import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowUpsPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            // Fetch real follow-ups linked to clients
            const { data, error } = await supabase
                .from('follow_ups')
                .select(`
                    id,
                    contact_date,
                    notes,
                    method,
                    clients (
                        name
                    )
                `)
                .order('contact_date', { ascending: true });

            if (data) {
                const generatedTasks = data.map((item: any) => ({
                    id: item.id,
                    clientName: item.clients?.name || 'Unknown Client',
                    type: item.method === 'phone' ? 'Phone Follow-up' : 'In-person Check-in',
                    priority: new Date(item.contact_date) < new Date() ? 'High' : 'Medium',
                    dueDate: new Date(item.contact_date).toLocaleDateString(),
                    notes: item.notes
                }));
                setTasks(generatedTasks);
            } else if (error) {
                console.error("Error fetching follow-ups:", error);
            }
            setLoading(false);
        };
        fetchTasks();
    }, []);

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark">
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ActionButton variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← Back</ActionButton>
                        <h1 className="text-xl font-bold">Follow-ups & Tasks</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <GlassCard className="p-4 flex items-center gap-4 bg-red-500/10 border-red-500/20">
                        <div className="p-3 bg-red-500 rounded-xl text-white"><AlertCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{tasks.filter(t => t.priority === 'High').length}</p>
                            <p className="text-xs uppercase font-bold text-slate-500">High Priority</p>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4 flex items-center gap-4 bg-amber-500/10 border-amber-500/20">
                        <div className="p-3 bg-amber-500 rounded-xl text-white"><Clock className="w-6 h-6" /></div>
                        <div>
                            <p className="text-2xl font-bold text-amber-500">{tasks.filter(t => t.priority === 'Medium').length}</p>
                            <p className="text-xs uppercase font-bold text-slate-500">Upcoming</p>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4 flex items-center gap-4 bg-green-500/10 border-green-500/20">
                        <div className="p-3 bg-green-500 rounded-xl text-white"><CheckCircle2 className="w-6 h-6" /></div>
                        <div>
                            <p className="text-2xl font-bold text-green-500">12</p>
                            <p className="text-xs uppercase font-bold text-slate-500">Completed This Week</p>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold mb-4">Action Items</h2>
                    {tasks.map((task, i) => (
                        <GlassCard key={i} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <div>
                                    <h3 className="font-bold">{task.type}</h3>
                                    <p className="text-sm text-slate-500">Client: {task.clientName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Due Date</p>
                                    <p className="font-medium text-sm flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {task.dueDate}
                                    </p>
                                </div>
                                <ActionButton size="sm">Mark Complete</ActionButton>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
}
