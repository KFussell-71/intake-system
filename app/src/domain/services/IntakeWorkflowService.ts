import { IntakeEntity, ClientAggregate } from '../entities/ClientAggregate';
import { DomainEventBus } from '../events/DomainEventBus';
import type { IntakeFormData } from '@/features/intake/intakeTypes';
import { AIIntegrityAgent } from './AIIntegrityAgent';
import { intakeRepository } from '@/repositories/IntakeRepository';

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
     * SME: Versioned Progress Save with Clinical Event Logging
     */
    static async saveProgress(intake: IntakeEntity, data: Partial<IntakeFormData>, summary: string, userId: string) {
        const oldData = intake.data;

        // 1. Detect Changes for Clinical Event Log
        const criticalFields = ['primaryDiagnosisCode', 'mobilityStatus', 'eligibility_status', 'recommended_priority_level'];
        const changedFields = Object.keys(data).filter(key =>
            criticalFields.includes(key) &&
            JSON.stringify(data[key as keyof IntakeFormData]) !== JSON.stringify(oldData[key as keyof IntakeFormData])
        );

        // 2. Perform state update
        intake.updateData(data, summary, userId);

        // 3. Persist Clinical Events
        for (const field of changedFields) {
            await intakeRepository.logClinicalEvent({
                intakeId: intake.id,
                fieldName: field,
                oldValue: oldData[field as keyof IntakeFormData],
                newValue: data[field as keyof IntakeFormData],
                userId: userId
                // rationaleId can be linked later if captured in the same payload
            });
        }

        await DomainEventBus.publish({
            type: 'INTAKE_UPDATED',
            payload: {
                intakeId: intake.id,
                userId,
                summary,
                changedFields
            },
            occurredAt: Date.now()
        });

        return intake;
    }
}
