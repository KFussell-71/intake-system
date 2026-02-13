'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type AvailabilityBlock = {
    id: string;
    user_id: string;
    start_time: string;
    end_time: string;
    title: string;
    is_recurring: boolean;
};

export async function getAvailabilityBlocks(userId: string, startDate: Date, endDate: Date) {
    try {
        const { data, error } = await supabase
            .from('availability_blocks')
            .select('*')
            .eq('user_id', userId)
            .gte('start_time', startDate.toISOString())
            .lte('end_time', endDate.toISOString())
            .order('start_time', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as AvailabilityBlock[] };
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return { success: false, message: error.message };
    }
}

export async function addAvailabilityBlock(data: {
    user_id: string;
    start_time: string;
    end_time: string;
    title?: string;
    is_recurring?: boolean;
}) {
    try {
        // Basic validation: End > Start
        if (new Date(data.end_time) <= new Date(data.start_time)) {
            return { success: false, message: 'End time must be after start time' };
        }

        const { data: newBlock, error } = await supabase
            .from('availability_blocks')
            .insert({
                user_id: data.user_id,
                start_time: data.start_time,
                end_time: data.end_time,
                title: data.title || 'Unavailable',
                is_recurring: data.is_recurring || false
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/dashboard/schedule');
        return { success: true, data: newBlock };
    } catch (error: any) {
        console.error('Error adding availability block:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteAvailabilityBlock(blockId: string, userId: string) {
    try {
        const { error } = await supabase
            .from('availability_blocks')
            .delete()
            .eq('id', blockId)
            .eq('user_id', userId); // Security check

        if (error) throw error;

        revalidatePath('/dashboard/schedule');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting block:', error);
        return { success: false, message: error.message };
    }
}
