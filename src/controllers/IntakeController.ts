import { intakeService, IntakeService } from '../services/IntakeService';
import { validateIntakeLogic } from '@/lib/agents/complianceAgent';
import { generateSuccessSuggestions } from '@/lib/agents/successAssistant';

export class IntakeController {
    constructor(private readonly service: IntakeService = intakeService) { }

    async runComplianceCheck(data: any) {
        return await validateIntakeLogic(data);
    }

    async getSuccessSuggestions(data: any) {
        return await generateSuccessSuggestions(data);
    }

    async handleIntakeSubmission(formData: any) {
        try {
            // Controller coordinates the service call
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

    async getAssessment(intakeId: string) {
        return await this.service.getIntakeAssessment(intakeId);
    }

    async saveAssessment(data: any) {
        try {
            const result = await this.service.saveAssessment(data);
            return { success: true, data: result };
        } catch (error) {
            console.error('Assessment save error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async addSupervisionNote(note: any) {
        try {
            const result = await this.service.addSupervisionNote(note);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async getSupervisionHistory(intakeId: string) {
        return await this.service.getSupervisionHistory(intakeId);
    }
}

export const intakeController = new IntakeController();
