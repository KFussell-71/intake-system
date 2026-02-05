'use client';

import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Search, Filter, MoreHorizontal, FileText, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InviteToPortalButton from "@/features/clients/components/InviteToPortalButton";

export default function DirectoryPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            // SECURITY: Fetch only necessary columns - explicitly exclude ssn_last_four
            // This prevents PII from being transmitted to the browser
            const { data, error } = await supabase
                .from('clients')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    created_at,
                    assigned_to,
                    created_by,
                    intakes (
                        id,
                        status,
                        report_date,
                        created_at
                    ),
                    client_users (
                        is_active,
                        expires_at
                    )
                `)
                .order('created_at', { ascending: false });

            if (data) {
                // Map to latest intake info
                const processed = data.map(c => ({
                    ...c,
                    latest_intake: c.intakes?.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0]
                }));
                setClients(processed);
            }
            setLoading(false);
        };
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark selection:bg-accent/30 selection:text-accent font-body">
            <nav className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-slate-800 dark:text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ActionButton
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="!p-1"
                            >
                                <MoreHorizontal className="w-5 h-5 rotate-180" />
                            </ActionButton>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Client Directory</h1>
                            <p className="text-[10px] uppercase font-bold text-primary tracking-widest opacity-70">Employment Services System</p>
                        </div>
                    </div>
                    <ActionButton
                        variant="primary"
                        size="sm"
                        onClick={() => router.push('/intake')}
                        className="shadow-lg shadow-primary/20"
                    >
                        + New Intake
                    </ActionButton>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row gap-4 mb-10 translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            className="w-full pl-12 pr-4 py-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <ActionButton variant="secondary" icon={<Filter className="w-4 h-4" />} className="h-full">
                            Filter
                        </ActionButton>
                        <ActionButton variant="ghost" className="h-full">
                            Export
                        </ActionButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-40 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))
                    ) : filteredClients.map((client, idx) => (
                        <GlassCard
                            key={client.id}
                            className="group relative flex flex-col p-6 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer border border-white/20 dark:border-white/5"
                            onClick={() => router.push(`/reports/${client.id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                                    {client.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex gap-1">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${client.latest_intake?.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                                        client.latest_intake?.status === 'locked' ? 'bg-slate-500/10 text-slate-500' :
                                            'bg-blue-500/10 text-blue-600'
                                        }`}>
                                        {client.latest_intake?.status || 'No Intake'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                    {client.name || 'Unnamed Client'}
                                </h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {client.email || 'No email provided'}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {client.latest_intake ? `Last update: ${new Date(client.latest_intake.report_date).toLocaleDateString()}` : 'Added ' + new Date(client.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <InviteToPortalButton
                                        clientId={client.id}
                                        clientName={client.name}
                                        clientEmail={client.email}
                                        hasActiveAccess={client.client_users?.is_active}
                                        expiresAt={client.client_users?.expires_at}
                                        iconOnly={true}
                                    />
                                    <button
                                        className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                        title="View Report"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/reports/${client.id}`);
                                        }}
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                    {!loading && filteredClients.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            No clients found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
