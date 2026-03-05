'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import { HIPAAAuthorizationData } from '@/features/documents/types/hipaaRelease';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Save HIPAA Authorization
 * 
 * Persists signed HIPAA release forms to the database.
 * This ensures legal compliance for social services.
 */
export async function saveHIPAAAuthorizationAction(intakeId: string, data: HIPAAAuthorizationData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const supabase = await createClient();

    try {
        // SECURITY: Record the event in the audit log first
        await supabase.from('intake_events').insert({
            intake_id: intakeId,
            event_type: 'hipaa_submitted',
            field_path: 'documents.hipaa',
            new_value: `Signed by ${data.representativeName || 'Client'}`,
            changed_by: auth.userId
        });

        // 1. Create a document record
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .insert({
                client_id: intakeId, // We use intakeId as fallback for client_id
                name: `HIPAA Authorization - ${new Date().toLocaleDateString()}`,
                type: 'legal/hipaa',
                url: 'signed_in_engine', // Data is embedded in JSONB for now, or could link to PDF
                uploaded_by: auth.userId
            })
            .select()
            .single();

        if (docError) throw docError;

        // 2. Update the intake JSON data with the release status
        const { error: intakeError } = await supabase
            .from('intakes')
            .update({
                data: {
                    hipaa_status: 'signed',
                    hipaa_date: new Date().toISOString(),
                    hipaa_doc_id: doc.id
                }
            } as any)
            .eq('id', intakeId);

        if (intakeError) throw intakeError;

        hipaaLogger.info('HIPAA authorization successfully persisted', { intakeId, docId: doc.id });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath('/portal');

        return { success: true, docId: doc.id };

    } catch (err: any) {
        hipaaLogger.error('Failed to save HIPAA authorization', { error: err.message, intakeId });
        return { success: false, error: err.message };
    }
}
