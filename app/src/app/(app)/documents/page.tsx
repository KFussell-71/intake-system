'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { ArrowLeft } from 'lucide-react';
import { DocumentManager } from '@/features/documents/DocumentManager';
import { motion } from 'framer-motion';

export default function DocumentsPage() {
    const router = useRouter();
    // In a real app, this would be selected from a list or URL param. 
    // For this demo, we can simulate picking a "Current Client" or just show a placeholder if none selected.
    // To make it fully functional "Noob Friendly", let's assume we are working with the most recent client or a specific ID.
    // For now, I'll hardcode a "Demo Client" ID or use a selector if easily available. 
    // Better: Allow entering a Client ID to lookup.

    const [clientId, setClientId] = useState('');
    const [isClientSelected, setIsClientSelected] = useState(false);

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark p-6">
            <nav className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
                <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    icon={<ArrowLeft className="w-4 h-4" />}
                >
                    Back to Dashboard
                </ActionButton>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Digital File Cabinet</h1>
            </nav>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {!isClientSelected ? (
                    <GlassCard className="p-8 text-center space-y-4 w-full">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📂</span>
                        </div>
                        <h2 className="text-xl font-bold">Select a Client</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Enter a Client ID to access their secure document storage. In the full system, you would click "Documents" from the Client Profile.
                        </p>
                        <div className="max-w-xs mx-auto flex gap-2">
                            <input
                                type="text"
                                placeholder="Paste Client ID here..."
                                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                            />
                            <ActionButton
                                onClick={() => setIsClientSelected(true)}
                                disabled={!clientId}
                            >
                                Open
                            </ActionButton>
                        </div>
                    </GlassCard>
                ) : (
                    <GlassCard className="p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div>
                                <h2 className="text-lg font-bold">Client Documents</h2>
                                <p className="text-xs text-slate-400 font-mono">ID: {clientId}</p>
                            </div>
                            <button
                                onClick={() => setIsClientSelected(false)}
                                className="text-sm text-primary hover:underline"
                            >
                                Change Client
                            </button>
                        </div>
                        <DocumentManager clientId={clientId} />
                    </GlassCard>
                )}
            </motion.div>
        </div>
    );
}
