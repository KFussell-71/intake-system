import React, { useState } from 'react';
import { FileSignature, Lock, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useConsent, ConsentSignature } from '../hooks/useConsent';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';

interface Props {
    intakeId: string;
}

export const ModernizedConsentSection: React.FC<Props> = ({ intakeId }) => {
    const { document, signatures, loading, createConsent, signConsent } = useConsent(intakeId);
    const [isCreating, setIsCreating] = useState(false);
    const [scopeText, setScopeText] = useState('I authorize the release of my employment and intake information to relevant state agencies and potential employers for the purpose of job placement assistance.');
    const [signerName, setSignOutName] = useState('');

    if (loading) return <div className="p-4 text-center text-slate-500">Loading consent status...</div>;

    // View: No Consent Document Created
    if (!document && !isCreating) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Consent Document</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    A Release of Information (ROI) document is required to proceed with external referrals.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Initialize Consent Protocol
                </Button>
            </div>
        );
    }

    // View: Creating Consent Document
    if (!document && isCreating) {
        return (
            <GlassCard className="p-6 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary" />
                    Initialize Release of Information
                </h3>

                <div className="space-y-4">
                    <ElegantTextarea
                        label="Scope of Release"
                        name="scope"
                        value={scopeText}
                        onChange={(e) => setScopeText(e.target.value)}
                        rows={4}
                    />
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-sm">
                        Running Template Version: <strong>v2026.02 (Standard)</strong>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button
                        onClick={() => createConsent(scopeText)}
                        disabled={!scopeText}
                    >
                        Create Document
                    </Button>
                </div>
            </GlassCard>
        );
    }

    // View: Document Active (Signing Mode)
    return (
        <div className="space-y-6">
            <GlassCard className="p-6 border-l-4 border-l-primary/50 relative overflow-hidden">
                {document?.locked && (
                    <div className="absolute top-4 right-4 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1 text-slate-500">
                        <Lock className="w-3 h-3" />
                        LOCKED
                    </div>
                )}

                <h3 className="text-lg font-bold mb-4">Release of Information (Active)</h3>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md font-mono text-sm mb-6 text-slate-600 dark:text-slate-300">
                    {document?.scope_text}
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Signatures</h4>

                    {signatures.length === 0 && (
                        <p className="text-sm text-slate-400 italic">No signatures recorded yet.</p>
                    )}

                    <div className="grid gap-3">
                        {signatures.map((sig) => (
                            <div key={sig.id} className="flex items-center justify-between bg-white dark:bg-white/5 p-3 rounded border border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">
                                        {sig.signer_role.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{sig.signer_name}</div>
                                        <div className="text-xs text-slate-500 capitalize">{sig.signer_role}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {new Date(sig.signed_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!document?.locked && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                            <h4 className="text-sm font-semibold mb-4">Add Signature</h4>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <ElegantInput
                                        label="Signer Name"
                                        name="signerName"
                                        value={signerName}
                                        onChange={(e) => setSignOutName(e.target.value)}
                                        placeholder="Type name to sign..."
                                    />
                                </div>
                                <Button
                                    onClick={() => {
                                        signConsent(signerName, 'client', 'pad');
                                        setSignOutName('');
                                    }}
                                    disabled={!signerName}
                                >
                                    Sign as Client
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        signConsent(signerName, 'witness', 'pad');
                                        setSignOutName('');
                                    }}
                                    disabled={!signerName}
                                >
                                    Sign as Witness
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                * Signing as Client will LOCK the document scope.
                            </p>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};
