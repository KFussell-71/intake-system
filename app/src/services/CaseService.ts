import { prisma as db, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { Case, CaseStatus, CaseStage } from '@/types/case';
import { caseloadBalancer } from '@/lib/logic/caseload';
import { clinicalCaseService, ClinicalCaseService } from './ClinicalCaseService';

export class CaseService {
    constructor(
        private readonly caseOrchestrator: ClinicalCaseService = clinicalCaseService
    ) { }
    /**
     * Create a new case from an intake
     * Triggered when an intake is approved and converted to a case.
     */
    async createCaseFromIntake(clientId: string, userId: string): Promise<Case | null> {
        try {
            const data = await db.case.create({
                data: {
                    clientId: clientId,
                    assignedToId: userId,
                    status: 'active',
                    stage: 'assessment',
                    startDate: new Date()
                }
            });

            return data as any;
        } catch (error) {
            console.error('Error creating case:', error);
            throw error;
        }
    }

    /**
     * Get a single case by ID with related data
     */
    async getCaseById(caseId: string): Promise<Case | null> {
        const data = await db.case.findUnique({
            where: { id: caseId },
            include: {
                client: true,
                assignedTo: true
            }
        });

        if (!data) return null;
        return data as any;
    }

    /**
     * Get cases for a client
     */
    async getCasesByClient(clientId: string): Promise<Case[]> {
        const data = await db.case.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' }
        });

        return data as any[];
    }

    /**
     * Update case stage via the Deterministic Mutation Engine
     */
    async updateCaseStage(caseId: string, stage: CaseStage, version: number): Promise<Case | null> {
        return await this.caseOrchestrator.executeMutation(
            caseId,
            version,
            { clinical: { stage } },
            { type: 'CASE_STAGE_UPDATE', actorId: 'SYSTEM' } // Actor should be passed in production
        );
    }

    /**
     * Update case status via the Deterministic Mutation Engine
     */
    async updateCaseStatus(caseId: string, status: CaseStatus, version: number, closureReason?: string): Promise<Case | null> {
        const payload: any = { status };
        if (status === 'closed') {
            payload.closed_date = new Date().toISOString();
            if (closureReason) payload.closure_reason = closureReason;
        }

        return await this.caseOrchestrator.executeMutation(
            caseId,
            version,
            { clinical: payload },
            { type: 'CASE_STATUS_UPDATE', actorId: 'SYSTEM' }
        );
    }

    /**
     * Get all cases (for dashboard)
     * Optionally filter by assigned user
     */
    async getCases(assignedToUserId?: string): Promise<Case[]> {
        const data = await db.case.findMany({
            where: assignedToUserId ? { assignedToId: assignedToUserId } : {},
            include: {
                client: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return data as any[];
    }

    /**
     * Get aggregated timeline for a case
     * Merges notes, service logs, and status changes (mocked/derived)
     */
    async getCaseTimeline(caseId: string): Promise<any[]> {
        const currentCase = await this.getCaseById(caseId);
        if (!currentCase) return [];

        // 1. Fetch Case Notes
        const notes = await (db as any).caseNote.findMany({
            where: { clientId: currentCase.clientId || currentCase.client_id },
            include: { author: { select: { username: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // 2. Fetch Service Logs including provider details
        const services = await (db as any).serviceLog.findMany({
            where: { caseId: caseId },
            include: { provider: { select: { username: true } } },
            orderBy: { performedAt: 'desc' },
            take: 10
        });

        // Combine and sort
        const timeline = [
            ...(notes?.map((n: any) => ({ ...n, type: 'note', date: n.createdAt })) || []),
            ...(services?.map((s: any) => ({ ...s, type: 'service', date: s.performedAt })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return timeline;
    }

    /**
     * Log a service delivery
     */
    async logService(data: { case_id: string; service_type: string; notes?: string; duration_minutes?: number; performed_at?: string; provider_id?: string }): Promise<any> {
        const result = await (db as any).serviceLog.create({
            data: {
                caseId: data.case_id,
                serviceType: data.service_type,
                notes: data.notes,
                durationMinutes: data.duration_minutes,
                performedAt: data.performed_at ? new Date(data.performed_at) : new Date(),
                providerId: data.provider_id
            }
        });

        return result;
    }

    /**
     * Schedule a follow-up
     */
    async scheduleFollowUp(data: { case_id: string; scheduled_date: string; type: string; notes?: string }): Promise<any> {
        const result = await (db as any).followUp.create({
            data: {
                caseId: data.case_id,
                scheduledDate: new Date(data.scheduled_date),
                type: data.type,
                status: 'scheduled',
                notes: data.notes
            }
        });

        return result;
    }
    /**
     * Auto-assigns a case to the best fit staff member
     */
    async autoAssign(caseId: string) {
        return await caseloadBalancer.assignCase(caseId);
    }
}

export const caseService = new CaseService();
