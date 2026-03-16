'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
    createConsentDocumentAction, 
    signConsentAction, 
    updateIntakeSection,
    getConsentDataAction 
} from '@/app/(app)/actions/modernizedIntakeActions';

export interface ConsentDocument {
    id: string;
    scopeText: string | null;
    templateVersion: string | null;
    locked: boolean;
    createdAt: Date;
}

export interface ConsentSignature {
    id: string;
    signerName: string;
    signerRole: string;
    signedAt: Date;
}

/**
 * useConsent Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * This ensures that legal and compliance data is handled through the unified security model.
 */
export function useConsent(intakeId: string) {
    const [document, setDocument] = useState<any | null>(null);
    const [signatures, setSignatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConsent = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getConsentDataAction(intakeId);
            if (result.success) {
                setDocument(result.document);
                setSignatures(result.signatures || []);
            } else {
                setError(result.error || 'Failed to fetch consent data');
            }
        } catch (err: any) {
            console.error('Error fetching consent:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchConsent();
    }, [fetchConsent]);

    const createConsent = async (scopeText: string, version: string = 'v1.0') => {
        try {
            const result = await createConsentDocumentAction(intakeId, scopeText, version);
            if (result.success) {
                setDocument(result.data);
                setSignatures([]);
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const signConsent = async (signerName: string, role: 'client' | 'guardian' | 'witness', method: 'pad' | 'upload') => {
        if (!document) return { success: false, error: 'No document to sign' };
        try {
            const result = await signConsentAction(document.id, intakeId, signerName, role, method);
            if (result.success) {
                // If client signs, the action locks the document. Update local state.
                if (role === 'client') {
                    setDocument((prev: any) => prev ? { ...prev, locked: true } : null);
                }
                setSignatures((prev: any[]) => [...prev, result.data]);
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const setSectionStatus = async (status: 'in_progress' | 'complete') => {
        try {
            await updateIntakeSection(intakeId, 'consent', status);
            return { success: true };
        } catch (err: any) {
            console.error('Error updating status:', err);
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
        setSectionStatus,
        refresh: fetchConsent
    };
}
