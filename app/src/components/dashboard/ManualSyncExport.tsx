'use client';

import { useState } from 'react';
import { Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { intakeService } from '@/services/IntakeService';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualSyncExportProps {
    intakeId: string;
    clientName: string;
}

export function ManualSyncExport({ intakeId, clientName }: ManualSyncExportProps) {
    const [exporting, setExporting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const bundle = await intakeService.prepareExportBundle(intakeId);
            const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vanguard_Sync_${clientName.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to generate forensic sync bundle.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <GlassCard className="p-4 border-accent/20 bg-accent/5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Vanguard Mesh Fallback</h4>
                        <p className="text-xs text-slate-500">Sign and export for physical USB sync</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-green-500 font-bold text-sm flex items-center gap-1"
                        >
                            <ShieldCheck className="w-4 h-4" /> Exported
                        </motion.div>
                    ) : (
                        <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <ActionButton
                                onClick={handleExport}
                                isLoading={exporting}
                                icon={<Download className="w-4 h-4" />}
                                size="sm"
                                className="bg-accent text-white border-none shadow-sm h-9"
                            >
                                Export Bundle
                            </ActionButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
                <p>Use this ONLY if P2P mesh discovery fails. Ensure USB drive is encrypted per agency policy.</p>
            </div>
        </GlassCard>
    );
}

