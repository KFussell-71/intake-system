import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createConsentDocumentAction, signConsentAction } from '@/app/actions/modernizedIntakeActions';

export interface ConsentDocument {
    id: string;
    scope_text: string;
    template_version: string;
    locked: boolean;
    created_at: string;
}

export interface ConsentSignature {
    id: string;
    signer_name: string;
    signer_role: string;
    signed_at: string;
}

export function useConsent(intakeId: string) {
    const [document, setDocument] = useState<ConsentDocument | null>(null);
    const [signatures, setSignatures] = useState<ConsentSignature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConsent = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch latest consent document for this intake
            const { data: docs, error: docError } = await supabase
                .from('consent_documents')
                .select('*')
                .eq('intake_id', intakeId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (docError) throw docError;

            const doc = docs && docs.length > 0 ? docs[0] : null;
            setDocument(doc);

            if (doc) {
                const { data: sigs, error: sigError } = await supabase
                    .from('consent_signatures')
                    .select('*')
                    .eq('consent_document_id', doc.id);

                if (sigError) throw sigError;
                setSignatures(sigs || []);
            } else {
                setSignatures([]);
            }

        } catch (err: any) {
            console.error('Error fetching consent:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchConsent();
    }, [intakeId, fetchConsent]);

    const createConsent = async (scopeText: string, version: string = 'v1.0') => {
        try {
            // Optimistic update? No, wait for server
            const newDoc = await createConsentDocumentAction(intakeId, scopeText, version);
            setDocument(newDoc);
            setSignatures([]);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const signConsent = async (signerName: string, role: 'client' | 'guardian' | 'witness', method: 'pad' | 'upload') => {
        if (!document) return { success: false, error: 'No document to sign' };
        try {
            const newSig = await signConsentAction(document.id, intakeId, signerName, role, method);

            // If client signs, the action locks the document. Update local state.
            if (role === 'client') {
                setDocument(prev => prev ? { ...prev, locked: true } : null);
            }

            setSignatures(prev => [...prev, newSig]);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return {
        document,
        signatures,
        loading,
        error,
        createConsent,
        signConsent,
        refresh: fetchConsent
    };
}
