
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveDORReport(intakeId: string, reportData: any, status: 'draft' | 'final' = 'draft') {
    const supabase = await createClient();

    try {
        // 1. Fetch current intake data to merge
        const { data: intake, error: fetchError } = await supabase
            .from('intakes')
            .select('data')
            .eq('id', intakeId)
            .single();

        if (fetchError || !intake) throw new Error('Intake not found');

        // 2. Merge new report data into the existing JSONB 'data' column
        // We store it under 'dor_report' key
        const updatedData = {
            ...intake.data as object,
            dor_report: {
                ...reportData,
                status,
                last_updated: new Date().toISOString()
            }
        };

        // 3. Update the record
        const { error: updateError } = await supabase
            .from('intakes')
            .update({ data: updatedData })
            .eq('id', intakeId);

        if (updateError) throw updateError;

        revalidatePath('/intake');
        return { success: true };

    } catch (error) {
        console.error('Error saving DOR report:', error);
        return { success: false, error: 'Failed to save report' };
    }
}
