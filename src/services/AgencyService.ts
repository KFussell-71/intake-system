
import { createClient } from '@/lib/supabase/browser';

export interface AgencySettings {
    id: string;
    agency_name: string;
    contact_email?: string;
    logo_url?: string;
    theme_color?: string;
}

export const AgencyService = {
    async getSettings(): Promise<AgencySettings | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('agency_settings')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching agency settings:', error);
            return null;
        }
        return data as AgencySettings;
    },

    async updateSettings(settings: Partial<AgencySettings>): Promise<{ success: boolean; error?: any }> {
        const supabase = createClient();

        // Singleton pattern: Update the single row or insert if missing (though verify_standard_configs ensures it exists)
        // We will assume ID exists or update all rows since it's a single tenant.

        // First try to update ANY row (since there should be only one)
        // But RLS policies on update might require ID. 
        // Let's first fetch the ID if we don't have it, or just update where id is not null (hacky but works for singleton)

        const { error } = await supabase
            .from('agency_settings')
            .update(settings)
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

        if (error) {
            console.error('Error updating agency settings:', error);
            return { success: false, error };
        }

        return { success: true };
    }
};
