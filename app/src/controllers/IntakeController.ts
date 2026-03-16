import { intakeService, IntakeService } from '../services/IntakeService';
import { validateIntakeLogic } from '@/lib/agents/complianceAgent';
import { generateSuccessSuggestions } from '@/lib/agents/successAssistant';
import type { IntakeFormData } from '@/features/intake/intakeTypes';
import type { IntakeAssessment } from '../repositories/IntakeRepository';

export class IntakeController {
    constructor(private readonly service: IntakeService = intakeService) { }

    async runComplianceCheck(data: Partial<IntakeFormData>) {
        return await validateIntakeLogic(data as any);
    }

    async getSuccessSuggestions(data: Partial<IntakeFormData>) {
        return await generateSuccessSuggestions(data as any);
    }

    async getAssessment(intakeId: string) {
        return await this.service.getIntakeAssessment(intakeId);
    }

    async saveAssessment(assessment: Partial<IntakeAssessment>) {
        return await this.service.saveAssessment(assessment);
    }

    async saveDraft(data: Partial<IntakeFormData>, intakeId?: string, expectedVersion?: number) {
        try {
            // This now calls the service which handles auth and repo RPC
            const result = await this.service.saveIntakeProgress(intakeId || '', data, "Draft Save", expectedVersion);
            return { success: true, data: result };
        } catch (error) {
            console.error('Draft save error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async loadLatestDraft() {
        try {
            // We'll add this to the service
            const result = await this.service.loadLatestDraft();
            return { success: true, data: result };
        } catch (error) {
            console.error('Draft load error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async handleIntakeSubmission(formData: IntakeFormData) {
        try {
            const result = await this.service.submitNewIntake(formData);
            return { success: true, data: result };
        } catch (error) {
            console.error('Intake submission error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async saveIntakeProgress(intakeId: string, data: Partial<IntakeFormData>, editComment?: string, expectedVersion?: number) {
        try {
            const result = await this.service.saveIntakeProgress(intakeId, data, editComment, expectedVersion);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async finalizeEligibility(intakeId: string, eligibility: { decision: string, rationale: string }) {
        try {
            // This should probably be a service method for "Finalize Assessment"
            // For now, updating via saveAssessment logic
            await this.service.saveAssessment({
                intake_id: intakeId,
                eligibility_status: eligibility.decision as any,
                eligibility_rationale: eligibility.rationale,
                finalized_at: new Date().toISOString(),
                is_locked: true
            });
            return { success: true };
        } catch (error) {
            console.error('Eligibility finalization error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async fetchServerData(intakeId: string) {
        return await this.service.fetchServerData(intakeId);
    }
}

export const intakeController = new IntakeController();
