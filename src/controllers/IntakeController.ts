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

    async handleIntakeSubmission(formData: any, userId?: string) {
        try {
            // Get userId from formData if not provided as parameter
            const effectiveUserId = userId || formData.assigned_to || formData.userId;
            
            if (!effectiveUserId) {
                throw new Error('User ID is required for intake submission');
            }
            
            // Controller coordinates the service call
            const result = await this.service.submitNewIntake(formData, effectiveUserId);
            return { success: true, data: result };
        } catch (error) {
            console.error('Intake submission error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}

export const intakeController = new IntakeController();
