'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { cookies } from 'next/headers';
import { updateIntakeSection } from './modernizedIntakeActions';

export interface IdentityData {
    clientName: string;
    ssnLastFour: string;
    phone: string;
    email: string;
    address: string;
    reportDate: string;
    completionDate: string;
    sectionStatus?: 'not_started' | 'in_progress' | 'complete' | 'waived';
}

/**
 * Server Action: Save Identity (Dual-Write Pattern).
 * Writes to relational `intake_identity` AND legacy JSONB `intakes.data`.
 */
export async function saveIdentityAction(intakeId: string, data: Partial<IdentityData>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // In strict mode, we might enforce RBAC here

    const cookieStore = cookies();
    const supabase = await createClient();

    try {
        // 1. Relational Write (The Future)
        const relationalPayload: any = {
            intake_id: intakeId,
            updated_by: auth.userId,
            updated_at: new Date().toISOString()
        };

        // Map fields that exist in relational schema
        if (data.clientName) {
            const parts = data.clientName.split(' ');
            relationalPayload.first_name = parts[0];
            relationalPayload.last_name = parts.slice(1).join(' ');
        }
        if (data.ssnLastFour) relationalPayload.ssn_last_four = data.ssnLastFour;
        if (data.phone) relationalPayload.phone = data.phone;
        if (data.email) relationalPayload.email = data.email;
        if (data.address) relationalPayload.address = data.address;
        if (data.reportDate) relationalPayload.dob = new Date(data.reportDate).toISOString().split('T')[0];

        const { error: relError } = await supabase
            .from('intake_identity')
            .upsert(relationalPayload);

        if (relError) console.error('Relational Write Failed', relError);

        // 2. Legacy JSONB Write (The Compatibility Layer)
        const { data: current, error: fetchError } = await supabase
            .from('intakes')
            .select('data')
            .eq('id', intakeId)
            .single();

        if (fetchError) throw fetchError;

        const newData = { ...current.data, ...data };

        const { error: jsonError } = await supabase
            .from('intakes')
            .update({
                data: newData,
                report_date: data.reportDate,
                completion_date: data.completionDate || null
            })
            .eq('id', intakeId);

        if (jsonError) throw jsonError;

        // 3. Audit Log (Event Sourcing)
        const changes = Object.keys(data).filter(k => k !== 'sectionStatus');
        if (changes.length > 0) {
            await supabase.from('intake_events').insert({
                intake_id: intakeId,
                event_type: 'field_update',
                field_path: 'identity', // simplified
                new_value: JSON.stringify(data), // succinct
                changed_by: auth.userId
            });
        }

        // 4. Update Section Status
        if (data.sectionStatus) {
            await updateIntakeSection(intakeId, 'identity', data.sectionStatus);
        }

        return { success: true };

    } catch (err: any) {
        console.error('saveIdentityAction Error', err);
        return { success: false, error: err.message };
    }
}
