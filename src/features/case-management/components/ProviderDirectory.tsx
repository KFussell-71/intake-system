'use client';

import { useEffect, useState } from 'react';
import { ServiceProvider, referralService } from '@/services/ReferralService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Globe, Phone, ArrowRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    caseId?: string; // Optional: if provided, enables "Refer" button
    onRefer?: () => void;
}

export function ProviderDirectory({ caseId, onRefer }: Props) {
    const [providers, setProviders] = useState<ServiceProvider[]>([]);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const data = await referralService.getProviders();
            setProviders(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRefer = async (providerId: string) => {
        if (!caseId) return;
        setProcessingId(providerId);
        try {
            await referralService.createReferral({
                case_id: caseId,
                provider_id: providerId,
                outcome_notes: 'Referral initiated from directory'
            });
            toast.success('Referral sent successfully');
            if (onRefer) onRefer();
        } catch (error) {
            console.error(error);
            toast.error('Failed to send referral');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.category.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...Array.from(new Set(providers.map(p => p.category)))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search providers..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={categoryFilter === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCategoryFilter(cat)}
                            className={categoryFilter === cat ? 'bg-slate-900 border-slate-900' : 'bg-white'}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map(provider => (
                    <GlassCard key={provider.id} className="p-5 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <Badge variant={provider.status === 'active' ? 'secondary' : 'destructive'} className={provider.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                {provider.status === 'active' ? 'Accepting' : provider.status === 'full' ? 'Waitlist' : 'Inactive'}
                            </Badge>
                        </div>

                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{provider.name}</h4>
                        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">{provider.category}</p>

                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1 line-clamp-3">
                            {provider.description}
                        </p>

                        <div className="space-y-2 text-sm text-slate-500 mb-4">
                            {provider.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{provider.address}</span>
                                </div>
                            )}
                            {provider.contact_phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    <span>{provider.contact_phone}</span>
                                </div>
                            )}
                            {provider.website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3 h-3" />
                                    <span className="truncate">{provider.website}</span>
                                </div>
                            )}
                        </div>

                        {caseId && (
                            <Button
                                className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white"
                                onClick={() => handleRefer(provider.id)}
                                disabled={processingId === provider.id || provider.status !== 'active'}
                            >
                                {processingId === provider.id ? 'Sending...' : (
                                    <span className="flex items-center gap-2">
                                        Refer Client <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        )}
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
