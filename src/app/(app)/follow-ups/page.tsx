'use client';

import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Calendar, CheckCircle2, AlertCircle, Clock, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { updateFollowUpStatus } from "@/app/actions/updateFollowUpStatus";
import { createFollowUp } from "@/app/actions/followUpActions";

export default function FollowUpsPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);

        // 1. Fetch Follow-ups
        const { data: followUps, error: followUpsError } = await supabase
            .from('follow_ups')
            .select(`
                id,
                contact_date,
                notes,
                method,
                status,
                clients (
                    id,
                    name
                )
            `)
            .order('contact_date', { ascending: true });

        if (followUps) {
            const filteredData = followUps.filter((item: any) => item.status !== 'completed');
            const generatedTasks = filteredData.map((item: any) => ({
                id: item.id,
                clientId: item.clients?.id,
                clientName: item.clients?.name || 'Unknown Client',
                type: item.method === 'phone' ? 'Phone Follow-up' : 'In-person Check-in',
                priority: new Date(item.contact_date) < new Date() ? 'High' : 'Medium',
                dueDate: new Date(item.contact_date).toLocaleDateString(),
                notes: item.notes,
                status: item.status
            }));
            setTasks(generatedTasks);

            // Calculate completed count
            const { count } = await supabase
                .from('follow_ups')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            setCompletedCount(count || 0);
        }

        // 2. Fetch Active Clients for Dropdown
        const { data: clientList } = await supabase
            .from('clients')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (clientList) setClients(clientList);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleComplete = async (id: string) => {
        const result = await updateFollowUpStatus(id, 'completed');
        if (result.success) {
            toast.success('Task marked as complete');
            await fetchData();
        } else {
            toast.error('Failed to update status');
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const result = await createFollowUp(null, formData);

        if (result.success) {
            toast.success('Follow-up created successfully');
            setIsDialogOpen(false);
            fetchData();
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark selection:bg-accent/30 selection:text-accent font-body">
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ActionButton variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← Back</ActionButton>
                        <div>
                            <h1 className="text-xl font-bold">Follow-ups & Tasks</h1>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Daily Activity Queue</p>
                        </div>
                    </div>
                    <ActionButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        New Task
                    </ActionButton>
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
                            <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                            <p className="text-xs uppercase font-bold text-slate-500">Total Recorded</p>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Action Items
                    </h2>

                    {loading ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse">Loading tasks...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                            All caught up! No pending follow-ups.
                        </div>
                    ) : (
                        tasks.map((task, i) => (
                            <GlassCard key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 group hover:border-indigo-500/30 transition-all duration-300">
                                <div className="flex items-start gap-4 mb-4 md:mb-0">
                                    <div className={`w-2 h-12 rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{task.type}</h3>
                                            {task.priority === 'High' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Overdue</span>}
                                        </div>
                                        <div
                                            onClick={() => router.push(`/clients/${task.clientId}`)}
                                            className="text-sm text-slate-500 flex items-center gap-1.5 hover:text-indigo-500 cursor-pointer transition-colors"
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            {task.clientName}
                                        </div>
                                        {task.notes && <p className="text-sm text-slate-400 mt-2 bg-slate-50 dark:bg-black/20 p-2 rounded-lg italic">"{task.notes}"</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pl-6 md:pl-0 border-l-2 border-slate-100 md:border-0 dark:border-white/5">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Due Date</p>
                                        <p className="font-medium text-sm flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500" /> {task.dueDate}
                                        </p>
                                    </div>
                                    <ActionButton
                                        size="sm"
                                        onClick={() => handleComplete(task.id)}
                                        className="bg-white dark:bg-white/10 hover:bg-green-50 hover:text-green-600 hover:border-green-200 border border-slate-200 dark:border-white/10 shadow-sm"
                                    >
                                        Mark Complete
                                    </ActionButton>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule New Follow-up</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select name="client_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" name="contact_date" required min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label>Method</Label>
                                <Select name="method" defaultValue="phone">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="phone">Phone Call</SelectItem>
                                        <SelectItem value="in-person">In-Person</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea name="notes" placeholder="What needs to be discussed?" />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Scheduling...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
