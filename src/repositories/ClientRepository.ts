import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase'; // Assuming types exist or will be generated

export class ClientRepository {
    async createClient(clientData: {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        created_by?: string;
    }) {
        const { data, error } = await supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createIntake(intakeData: {
        client_id: string;
        report_date: string;
        prepared_by?: string;
        completion_date?: string;
        data?: any;
    }) {
        const { data, error } = await supabase
            .from('intakes')
            .insert(intakeData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createClientWithIntakeRPC(params: {
        p_name: string;
        p_phone?: string;
        p_email?: string;
        p_address?: string;
        p_report_date: string;
        p_completion_date?: string;
        p_intake_data: any;
    }) {
        const { data, error } = await supabase.rpc('create_client_intake', params);
        if (error) throw error;
        return data;
    }
}

export const clientRepository = new ClientRepository();
