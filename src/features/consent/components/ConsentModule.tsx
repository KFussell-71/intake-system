'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileText, ShieldCheck, Lock, Signature } from 'lucide-react';
import { signConsentAction, createConsentDocumentAction } from '@/app/actions/consentWorkflowActions';

interface ConsentModuleProps {
    intakeId: string;
    onComplete?: () => void;
}

/**
 * ConsentModule
 * SME: Legal & Compliance Domain (ROI)
 * Relational-First document locking.
 */
export const ConsentModule: React.FC<ConsentModuleProps> = ({ intakeId, onComplete }) => {
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);

    const handleSign = async () => {
        setSigning(true);
        try {
            // In a real app, we'd fetch the document ID first
            // For MVP, we'll assume a workflow where we create or target one
            const result = await signConsentAction(
                "TEMP_DOC_ID",
                intakeId,
                "SAMPLE_SIGNER",
                "client",
                "pad"
            );

            if (result.success) {
                setSigned(true);
                if (onComplete) onComplete();
            }
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">Consent & ROI</h3>
                    <p className="text-xs text-white/50">Release of Information agreement</p>
                </div>
            </div>

            <GlassCard className="relative overflow-hidden">
                {!signed ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-900/50 rounded-lg border border-white/5 text-sm text-white/70 leading-relaxed">
                            <p className="mb-4">
                                I hereby authorize the release of my clinical and vocational records to the specified entities...
                                [Full HIPAA-compliant ROI text would appear here]
                            </p>
                            <p>
                                By signing below, you acknowledge that this consent is valid for 12 months unless revoked in writing.
                            </p>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <Lock size={14} />
                                Document will be locked upon signature
                            </div>
                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {signing ? 'Signing...' : <><Signature size={18} /> Sign & Lock ROI</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Document Signed & Secured</h4>
                            <p className="text-sm text-white/50">Immutable event recorded in ledger</p>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
