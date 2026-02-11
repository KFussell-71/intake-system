import { DomainEventBus } from '@/domain/events/DomainEventBus';
import { logAuditAction } from '@/app/actions/auditActions';

export function registerDomainEventHandlers() {
    // Audit Logging Handler
    DomainEventBus.subscribe('INTAKE_SUBMITTED', async (event) => {
        await logAuditAction({
            userId: event.payload.submittedBy,
            action: 'INTAKE_SUBMIT',
            entityType: 'intake',
            entityId: event.payload.intakeId,
            details: {
                clientId: event.payload.clientId,
                occurredAt: event.occurredAt
            }
        });
    });

    DomainEventBus.subscribe('INTAKE_UPDATED', async (event) => {
        await logAuditAction({
            userId: event.payload.userId,
            action: 'INTAKE_UPDATE',
            entityType: 'intake',
            entityId: event.payload.intakeId,
            details: {
                summary: event.payload.summary
            }
        });
    });
}
