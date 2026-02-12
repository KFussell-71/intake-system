'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, User, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Props {
    onClose: () => void;
}

export function ClientSearchDropdown({ onClose }: Props) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const searchClients = async () => {
            if (searchTerm.length < 2) {
                setClients([]);
                return;
            }

            setLoading(true);
            const { data } = await supabase
                .from('clients')
                .select(`
          id,
          name,
          email,
          intakes (
            id,
            status,
            report_date,
            created_at
          )
        `)
                .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (isMounted && data) {
                // Map to include latest intake
                const processed = data.map(c => ({
                    ...c,
                    latest_intake: c.intakes?.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0]
                }));
                setClients(processed);
            }
            if (isMounted) {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchClients, 300);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [searchTerm]);

    const handleSelect = (client: any) => {
        // If intake is draft, go to modernized intake flow
        if (client.latest_intake?.status === 'draft') {
            router.push(`/modernized-intake/${client.latest_intake.id}`);
        } else {
            // Otherwise go to reports
            router.push(`/reports/${client.id}`);
        }
        onClose();
    };

    return (
        <GlassCard className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 shadow-xl">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                </div>
            </div>

            {loading && (
                <div className="p-6 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Searching...
                </div>
            )}

            {!loading && searchTerm.length > 0 && searchTerm.length < 2 && (
                <div className="p-4 text-center text-sm text-slate-500">
                    Type at least 2 characters to search
                </div>
            )}

            {!loading && clients.length === 0 && searchTerm.length >= 2 && (
                <div className="p-6 text-center text-sm text-slate-500">
                    No clients found matching "{searchTerm}"
                </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {clients.map((client) => (
                    <button
                        key={client.id}
                        className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left flex items-center justify-between group transition-colors"
                        onClick={() => handleSelect(client)}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                                {client.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{client.name || 'Unnamed Client'}</div>
                                <div className="text-xs text-slate-500 truncate">{client.email || 'No email'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {client.latest_intake?.status === 'draft' && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-medium">
                                    In Progress
                                </span>
                            )}
                            {client.latest_intake?.status === 'approved' && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                                    Approved
                                </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                ))}
            </div>

            {clients.length > 0 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
                    <button
                        onClick={() => {
                            router.push('/directory');
                            onClose();
                        }}
                        className="text-xs text-primary hover:underline"
                    >
                        View all clients in directory →
                    </button>
                </div>
            )}
        </GlassCard>
    );
}
