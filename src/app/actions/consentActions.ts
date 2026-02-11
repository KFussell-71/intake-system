'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface ConsentDocument {
    id: string;
    template_version: string;
    scope_text: string;
    expires_at: string | null;
    locked: boolean;
    created_at: string;
    signatures: ConsentSignature[];
}

export interface ConsentSignature {
    id: string;
    signer_name: string;
    signer_role: string;
    signed_at: string;
    method: string;
}

export async function createConsentDocumentAction(intakeId: string, scopeText: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const cookieStore = cookies();
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('consent_documents')
            .insert({
                intake_id: intakeId,
                template_version: 'v2026.1 (Standard ROI)',
                scope_text: scopeText,
                expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                created_by: auth.userId,
                locked: false
            })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('intake_events').insert({
            intake_id: intakeId,
            event_type: 'consent_created',
            new_value: `Created ROI for: ${scopeText}`,
            changed_by: auth.userId
        });

        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function signConsentDocumentAction(documentId: string, signerName: string, role: string, signatureData: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const cookieStore = cookies();
    const supabase = await createClient();

    try {
        const hash = crypto.createHash('sha256').update(`${documentId}:${signerName}:${signatureData}:${new Date().toISOString()}`).digest('hex');

        const { error: signError } = await supabase
            .from('consent_signatures')
            .insert({
                consent_document_id: documentId,
                signer_name: signerName,
                signer_role: role,
                method: 'digital_pad',
                document_hash: hash,
                ip_address: '127.0.0.1'
            });

        if (signError) throw signError;

        const { error: lockError } = await supabase
            .from('consent_documents')
            .update({ locked: true })
            .eq('id', documentId);

        if (lockError) throw lockError;

        const { data: doc } = await supabase.from('consent_documents').select('intake_id').eq('id', documentId).single();
        if (doc) {
            await supabase.from('intake_events').insert({
                intake_id: doc.intake_id,
                event_type: 'consent_signed',
                new_value: `Signed by ${signerName} (${role})`,
                changed_by: auth.userId
            });
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getConsentsAction(intakeId: string) {
    const cookieStore = cookies();
    const supabase = await createClient();

    const { data } = await supabase
        .from('consent_documents')
        .select(`
            *,
            signatures:consent_signatures(*)
        `)
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false });

    return { success: true, data: data || [] };
}
