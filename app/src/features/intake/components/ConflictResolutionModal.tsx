import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertTriangle, Check, X, ArrowRight, Merge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    localData: any;
    serverData: any;
    onResolve: (resolvedData: any) => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({
    isOpen,
    onClose,
    localData,
    serverData,
    onResolve
}) => {
    const [selection, setSelection] = useState<Record<string, 'local' | 'server'>>({});

    if (!isOpen) return null;

    // Identify conflicting fields
    const allKeys = Array.from(new Set([...Object.keys(localData), ...Object.keys(serverData)]));
    const conflictingKeys = allKeys.filter(key => {
        const local = JSON.stringify(localData[key]);
        const server = JSON.stringify(serverData[key]);
        return local !== server && local !== undefined && server !== undefined;
    });

    const handleResolve = () => {
        const resolved = { ...serverData };
        conflictingKeys.forEach(key => {
            if (selection[key] === 'local') {
                resolved[key] = localData[key];
            }
        });
        onResolve(resolved);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                <GlassCard className="flex-1 flex flex-col p-0 border-amber-500/30 overflow-hidden">
                    <header className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Merge className="w-6 h-6 text-amber-500" />
                            <div>
                                <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Data Conflict Detected</h2>
                                <p className="text-xs text-amber-600/80 font-medium">Reconcile differences between your offline draft and the server.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {conflictingKeys.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="font-bold">No structural conflicts found.</p>
                                <p className="text-sm">Data can be safely merged.</p>
                            </div>
                        ) : (
                            conflictingKeys.map(key => (
                                <div key={key} className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ConflictOption
                                            label="Your Version (Offline)"
                                            value={JSON.stringify(localData[key], null, 2)}
                                            selected={selection[key] === 'local'}
                                            onClick={() => setSelection(prev => ({ ...prev, [key]: 'local' }))}
                                            variant="local"
                                        />
                                        <ConflictOption
                                            label="Server Version"
                                            value={JSON.stringify(serverData[key], null, 2)}
                                            selected={selection[key] === 'server'}
                                            onClick={() => setSelection(prev => ({ ...prev, [key]: 'server' }))}
                                            variant="server"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleResolve}
                            disabled={conflictingKeys.length > 0 && Object.keys(selection).length < conflictingKeys.length}
                            className="px-8 py-2 bg-amber-500 text-white rounded-full font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
                        >
                            Merge & Resolve
                        </button>
                    </footer>
                </GlassCard>
            </motion.div>
        </div>
    );
};

interface OptionProps {
    label: string;
    value: string;
    selected: boolean;
    onClick: () => void;
    variant: 'local' | 'server';
}

const ConflictOption: React.FC<OptionProps> = ({ label, value, selected, onClick, variant }) => {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selected
                    ? (variant === 'local' ? 'border-amber-500 bg-amber-50/50' : 'border-indigo-500 bg-indigo-50/50')
                    : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 opacity-60 grayscale-[0.5]'
                }`}
        >
            <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                </span>
                {selected && <Check className="w-4 h-4 text-emerald-500" />}
            </div>
            <pre className="text-[10px] font-mono whitespace-pre-wrap line-clamp-6 text-slate-600 dark:text-slate-400">
                {value}
            </pre>
        </div>
    );
};
