'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileSignature, Lock, CheckCircle, Plus } from 'lucide-react';
import { createConsentDocumentAction, signConsentDocumentAction, getConsentsAction, ConsentDocument } from '@/app/actions/consentActions';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { toast } from 'sonner';

interface Props {
    intakeId: string;
}

export const ConsentWorkflow: React.FC<Props> = ({ intakeId }) => {
    const [consents, setConsents] = useState<ConsentDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [signing, setSigning] = useState<string | null>(null); // document ID being signed

    // Form states
    const [scope, setScope] = useState('Release of Information for Coordination of Care');
    const [signerName, setSignerName] = useState('');

    const loadConsents = useCallback(async () => {
        setLoading(true);
        const res = await getConsentsAction(intakeId);
        if (res.success) setConsents(res.data);
        setLoading(false);
    }, [intakeId]);

    useEffect(() => {
        loadConsents();
    }, [loadConsents]);

    const handleCreate = async () => {
        setGenerating(true);
        const res = await createConsentDocumentAction(intakeId, scope);
        setGenerating(false);
        if (res.success) {
            toast.success('Document Created', { description: 'ROI is ready for signature.' });
            loadConsents();
        } else {
            toast.error('Error', { description: res.error });
        }
    };

    const handleSign = async (docId: string) => {
        if (!signerName) return toast.error('Name Required');

        const res = await signConsentDocumentAction(docId, signerName, 'Client', 'simulated_signature_data');
        if (res.success) {
            toast.success('Signed & Locked', { description: 'This document is now a permanent legal artifact.' });
            setSigning(null);
            setSignerName('');
            loadConsents();
        } else {
            toast.error('Signing Failed', { description: res.error });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary" />
                    Consent Artifacts
                </h3>
                <Button size="sm" onClick={() => setGenerating(true)} disabled={generating}>
                    <Plus className="w-4 h-4 mr-2" /> New ROI
                </Button>
            </div>

            {/* Generator Form */}
            {generating && (
                <GlassCard className="border-l-4 border-l-blue-500 animate-in slide-in-from-top-4">
                    <h4 className="font-bold mb-4">Generate Release of Information</h4>
                    <div className="space-y-4">
                        <ElegantInput
                            label="Scope of Release"
                            name="scope"
                            value={scope}
                            onChange={(e) => setScope(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setGenerating(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create Document</Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* List */}
            {loading ? <div>Loading...</div> : (
                <div className="space-y-4">
                    {consents.length === 0 && !generating && (
                        <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg border border-dashed border-slate-200 dark:border-white/10">
                            No active Release of Information documents found.
                        </div>
                    )}

                    {consents.map(doc => (
                        <GlassCard key={doc.id} className={`transition-all ${doc.locked ? 'opacity-80' : 'border-l-4 border-l-orange-400'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {doc.locked ? (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> LEGALLY LOCKED
                                            </span>
                                        ) : (
                                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                DRAFT - SIGNATURE REQUIRED
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold">{doc.scope_text}</h4>
                                    <p className="text-xs text-slate-500 mt-1">Version: {doc.template_version}</p>

                                    {doc.signatures && doc.signatures.length > 0 && (
                                        <div className="mt-3 pl-3 border-l-2 border-slate-200 text-sm">
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">Signed By:</p>
                                            {doc.signatures.map(sig => (
                                                <div key={sig.id} className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                    {sig.signer_name} ({sig.signer_role}) on {new Date(sig.signed_at).toLocaleDateString()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {!doc.locked && (
                                    <div className="flex flex-col gap-2">
                                        {signing === doc.id ? (
                                            <div className="bg-white dark:bg-black/20 p-2 rounded border border-slate-200 dark:border-white/10">
                                                <input
                                                    className="text-sm p-1 border rounded mb-2 w-full dark:bg-black/50"
                                                    placeholder="Type Name to Sign"
                                                    value={signerName}
                                                    onChange={(e) => setSignerName(e.target.value)}
                                                />
                                                <Button size="sm" className="w-full" onClick={() => handleSign(doc.id)}>Confirm Sign</Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => setSigning(doc.id)}>
                                                Collect Signature
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};
