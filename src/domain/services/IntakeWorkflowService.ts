import { IntakeEntity, ClientAggregate } from '../entities/ClientAggregate';
import { DomainEventBus } from '../events/DomainEventBus';
import type { IntakeFormData } from '@/features/intake/intakeTypes';
import { AIIntegrityAgent } from './AIIntegrityAgent';

export class IntakeWorkflowService {
    /**
     * SME: Intake Submission Lifecycle
     * Orchestrates the transition from draft to submitted.
     */
    static async submitIntake(client: ClientAggregate, intake: IntakeEntity, userId: string) {
        // 1. Perform domain logic
        intake.submit();

        // 2. Publish Domain Event
        await DomainEventBus.publish({
            type: 'INTAKE_SUBMITTED',
            payload: {
                intakeId: intake.id,
                clientId: client.id,
                submittedBy: userId,
                timestamp: Date.now()
            },
            occurredAt: Date.now()
        });

        // 3. SME: Agentic Shadowing (Phase 19.1)
        // Fire and forget, does not block submission
        AIIntegrityAgent.checkIntegrity(intake, userId).catch(err =>
            console.error('[IntakeWorkflowService] AI Shadow failure:', err)
        );

        // 4. Return updated aggregate for persistence
        return { client, intake };
    }

    /**
     * SME: Versioned Progress Save
     */
    static async saveProgress(intake: IntakeEntity, data: Partial<IntakeFormData>, summary: string, userId: string) {
        intake.updateData(data, summary, userId);

        await DomainEventBus.publish({
            type: 'INTAKE_UPDATED',
            payload: {
                intakeId: intake.id,
                userId,
                summary
            },
            occurredAt: Date.now()
        });

        return intake;
    }
}
