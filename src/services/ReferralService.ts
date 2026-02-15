import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export interface ServiceProvider {
    id: string;
    name: string;
    category: string;
    description: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website?: string;
    status: 'active' | 'inactive' | 'full';
    capacity?: number;
}

export interface Referral {
    id: string;
    case_id: string;
    provider_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    referral_date: string;
    outcome_notes?: string;
    provider?: ServiceProvider;
}

export class ReferralService {
    /**
     * Get all active service providers
     */
    async getProviders(): Promise<ServiceProvider[]> {
        const { data, error } = await supabase
            .from('service_providers')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as ServiceProvider[];
    }

    /**
     * Get referrals for a case
     */
    async getReferrals(caseId: string): Promise<Referral[]> {
        const { data, error } = await supabase
            .from('referrals')
            .select(`
                *,
                provider:service_providers(*)
            `)
            .eq('case_id', caseId)
            .order('referral_date', { ascending: false });

        if (error) throw error;
        return data as Referral[];
    }

    /**
     * Create a new referral
     */
    async createReferral(data: { case_id: string; provider_id: string; outcome_notes?: string }): Promise<Referral> {
        const { data: result, error } = await supabase
            .from('referrals')
            .insert({
                case_id: data.case_id,
                provider_id: data.provider_id,
                outcome_notes: data.outcome_notes,
                status: 'pending',
                referral_date: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    /**
     * Update referral status
     */
    async updateReferralStatus(referralId: string, status: string, notes?: string): Promise<void> {
        const updateData: any = { status };
        if (notes) updateData.outcome_notes = notes;

        const { error } = await supabase
            .from('referrals')
            .update(updateData)
            .eq('id', referralId);

        if (error) throw error;
    }
}

export const referralService = new ReferralService();
