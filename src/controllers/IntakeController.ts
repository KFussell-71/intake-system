import { intakeService, IntakeService } from '../services/IntakeService';
import { validateIntakeLogic } from '@/lib/agents/complianceAgent';
import { generateSuccessSuggestions } from '@/lib/agents/successAssistant';
import { supabase } from '@/lib/supabase';

export class IntakeController {
    constructor(private readonly service: IntakeService = intakeService) { }

    async runComplianceCheck(data: any) {
        return await validateIntakeLogic(data);
    }

    async getSuccessSuggestions(data: any) {
        return await generateSuccessSuggestions(data);
    }

    async getAssessment(intakeId: string) {
        return await this.service.getIntakeAssessment(intakeId);
    }

    async saveAssessment(assessment: any) {
        return await this.service.saveAssessment(assessment);
    }

    async saveDraft(data: any, intakeId?: string) {
        try {
            // Use the new RPC to save draft
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: result, error } = await supabase.rpc('save_intake_draft', {
                p_intake_id: intakeId || null,
                p_client_id: null, // Let backend logic handle client creation/linking
                p_intake_data: data,
                p_user_id: user.id
            });

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Draft save error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async loadLatestDraft() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'User not authenticated' };

            const { data: result, error } = await supabase.rpc('get_latest_user_draft', {
                p_user_id: user.id
            });

            if (error) throw error;

            if (result && result.found) {
                return { success: true, data: result };
            } else {
                return { success: true, data: null };
            }

        } catch (error) {
            console.error('Draft load error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async handleIntakeSubmission(formData: any) {
        try {
            // First submit via service
            const result = await this.service.submitNewIntake(formData);

            // If successful, we should verify the intake record status is updated
            // The service likely creates a new record or updates existing.
            // For now, we trust the service structure
            return { success: true, data: result };
        } catch (error) {
            console.error('Intake submission error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async saveIntakeProgress(intakeId: string, data: any, editComment?: string) {
        return this.saveDraft(data, intakeId);
    }

    async finalizeEligibility(intakeId: string, eligibility: { decision: string, rationale: string }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // In a real implementation, this would call a specific RPC or update table
            // For now, we simulate the event and update the status
            const status = eligibility.decision === 'eligible' ? 'approved' : 'rejected';

            const { error } = await supabase
                .from('intakes')
                .update({
                    status: status,
                    // Hypothetical columns as per plan
                    eligibility_status: eligibility.decision,
                    eligibility_rationale: eligibility.rationale,
                    eligibility_date: new Date().toISOString()
                })
                .eq('intake_id', intakeId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Eligibility finalization error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}

export const intakeController = new IntakeController();
