'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { updateIntakeSection } from './modernizedIntakeActions';
import { revalidatePath } from 'next/cache';

import { IdentityData } from '@/features/intake/intakeTypes';

/**
 * Server Action: Save Identity (Relational-First).
 * Writes exclusively to relational `intake_identity`.
 * Logs audit deltas to `intake_events`.
 */
export async function saveIdentityAction(intakeId: string, data: Partial<IdentityData>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const supabase = await createClient();

    try {
        // 1. Fetch Existing (for Audit Delta)
        const { data: oldData } = await supabase
            .from('intake_identity')
            .select('*')
            .eq('intake_id', intakeId)
            .single();

        // 2. Relational Write (The Source of Truth)
        const relationalPayload: any = {
            intake_id: intakeId,
            updated_at: new Date().toISOString()
        };

        if (data.clientName) {
            const parts = data.clientName.trim().split(/\s+/);
            relationalPayload.first_name = parts[0];
            relationalPayload.last_name = parts.slice(1).join(' ');
        }
        if (data.ssnLastFour !== undefined) relationalPayload.ssn_last_four = data.ssnLastFour;
        if (data.phone !== undefined) relationalPayload.phone = data.phone;
        if (data.email !== undefined) relationalPayload.email = data.email;
        if (data.address !== undefined) relationalPayload.address = data.address;
        if (data.birthDate !== undefined) relationalPayload.date_of_birth = data.birthDate;
        if (data.gender !== undefined) relationalPayload.gender = data.gender;
        if (data.race !== undefined) relationalPayload.race = data.race;

        const { error: relError } = await supabase
            .from('intake_identity')
            .upsert(relationalPayload, { onConflict: 'intake_id' });

        if (relError) throw new Error(`Relational Write Failed: ${relError.message}`);

        // 3. Audit Log (Event Sourcing)
        const changes = Object.keys(data).filter(k => k !== 'sectionStatus');
        for (const key of changes) {
            const newVal = (data as any)[key];
            const oldVal = oldData ? (oldData as any)[key === 'birthDate' ? 'date_of_birth' : key] : null;

            if (String(newVal) !== String(oldVal)) {
                await supabase.from('intake_events').insert({
                    intake_id: intakeId,
                    event_type: 'field_update',
                    field_path: `identity.${key}`,
                    old_value: oldVal ? String(oldVal) : null,
                    new_value: newVal ? String(newVal) : null,
                    changed_by: auth.userId
                });
            }
        }

        // 4. Update Section Status
        if (data.sectionStatus) {
            await updateIntakeSection(intakeId, 'identity', data.sectionStatus);
        }

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };

    } catch (err: any) {
        console.error('saveIdentityAction Error', err);
        return { success: false, error: err.message };
    }
}
