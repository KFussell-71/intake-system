import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Search, Filter, MoreHorizontal, FileText, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DirectoryPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('intakes')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setClients(data);
            setLoading(false);
        };
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.data.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.data.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark selection:bg-accent/30 selection:text-accent">
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                        >
                            ← Back
                        </ActionButton>
                        <h1 className="text-xl font-bold">Client Directory</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ActionButton variant="secondary" icon={<Filter className="w-4 h-4" />}>
                        Filters
                    </ActionButton>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-10 opacity-50">Loading directory...</div>
                    ) : filteredClients.map((client) => (
                        <GlassCard key={client.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {client.data.clientName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{client.data.clientName || 'Unnamed Client'}</h3>
                                    <p className="text-sm text-slate-500">{client.data.email || 'No contact info'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${client.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        client.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {client.status?.replace('_', ' ') || 'New'}
                                </span>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
                                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                </button>
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
