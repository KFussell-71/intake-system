'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { FileCheck, Download, Plus, CheckCircle2 } from 'lucide-react';
import { getStandardsAction, getPacketsAction, generatePacketAction } from '@/app/actions/accreditationActions';
import { AccreditationStandard, EvidencePacket } from '@/repositories/EvidenceRepository';

export const AccreditationManager = () => {
    const [standards, setStandards] = useState<AccreditationStandard[]>([]);
    const [packets, setPackets] = useState<EvidencePacket[]>([]);
    const [generating, setGenerating] = useState(false);

    const refreshData = async () => {
        const [stdRes, pktRes] = await Promise.all([
            getStandardsAction(),
            getPacketsAction()
        ]);
        if (stdRes.success) setStandards(stdRes.data || []);
        if (pktRes.success) setPackets(pktRes.data || []);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        await generatePacketAction();
        await refreshData();
        setGenerating(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Standards List */}
            <GlassCard className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Active Standards</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Compliance Checklist</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {standards.map(std => (
                        <div key={std.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{std.code}</span>
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{std.name}</h4>
                                </div>
                                <p className="text-xs text-slate-500">{std.description}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{std.category}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Evidence Packets */}
            <GlassCard className="lg:col-span-1 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-lg">Evidence Binders</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Generated Packets</p>
                    </div>
                    <ActionButton
                        size="sm"
                        onClick={handleGenerate}
                        isLoading={generating}
                        icon={<Plus className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20"
                    >
                        Generate
                    </ActionButton>
                </div>

                <div className="space-y-3">
                    {packets.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No evidence packets generated yet.</p>
                    ) : packets.map(pkt => (
                        <div key={pkt.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-emerald-500" />
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 line-clamp-1">{pkt.title}</h4>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{pkt.status}</span>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] text-slate-400 font-mono">{new Date(pkt.generated_at).toLocaleDateString()}</span>
                                <button className="text-xs text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1">
                                    <Download className="w-3 h-3" /> Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};
