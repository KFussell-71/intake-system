import { intakeService, IntakeService } from '../services/IntakeService';
import { validateIntakeLogic } from '@/lib/agents/complianceAgent';

export class IntakeController {
    constructor(private readonly service: IntakeService = intakeService) { }

    async runComplianceCheck(data: any) {
        return await validateIntakeLogic(data);
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
}

export const intakeController = new IntakeController();
