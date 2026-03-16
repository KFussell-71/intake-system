import { BaseRepository } from './BaseRepository';
import type { IntakeFormData } from '@/features/intake/intakeTypes';

export interface IntakeAssessment {
    id?: string;
    intakeId: string;
    counselorId?: string;
    verifiedBarriers: string[];
    clinicalNarrative: string;
    recommendedPriorityLevel: number;
    eligibilityStatus: 'pending' | 'eligible' | 'ineligible';
    eligibilityRationale: string;
    verificationEvidence?: Record<string, any>;
    isLocked?: boolean;
    finalizedAt?: string;
    aiDiscrepancyNotes?: string;
    aiRiskScore?: number;
    updatedAt?: string;
}


export interface ClientStatement {
    id?: string;
    intakeId: string;
    clientId?: string;
    presentingIssue: string;
    reportedBarriers: string[];
    goalsAndObjectives: string;
    updatedAt?: string;
}

export interface SupervisionNote {
    id: string;
    intakeId: string;
    supervisorId: string;
    noteType: 'approval' | 'rejection' | 'correction_request' | 'flag';
    content: string;
    requiredActions: string[];
    createdAt: string;
}

export class IntakeRepository extends BaseRepository {
    async getAssessment(intakeId: string): Promise<IntakeAssessment | null> {
        return await (this.db as any).intakeAssessment.findUnique({
            where: { intakeId }
        });
    }

    async getSupervisionHistory(intakeId: string) {
        return await (this.db as any).intakeSupervisionNote.findMany({
            where: { intakeId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getIntakeById(intakeId: string) {
        return await this.db.intake.findUnique({
            where: { id: intakeId }
        });
    }

    async getLatestUserDraft(userId: string) {
        return await this.db.intake.findFirst({
            where: {
                status: 'draft',
                preparedById: userId
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async upsertAssessmentAtomic(intakeId: string, assessment: Partial<IntakeAssessment>, userId: string) {
        return await (this.db as any).intakeAssessment.upsert({
            where: { intakeId },
            update: {
                ...assessment,
                updatedAt: new Date()
            },
            create: {
                ...assessment as any,
                intakeId,
                counselorId: userId
            }
        });
    }

    async addSupervisionNote(note: Omit<SupervisionNote, 'id' | 'createdAt'>) {
        return await (this.db as any).intakeSupervisionNote.create({
            data: {
                ...note as any,
                createdAt: new Date()
            }
        });
    }

    async getClientStatement(intakeId: string): Promise<ClientStatement | null> {
        return await (this.db as any).clientStatement.findUnique({
            where: { intakeId }
        });
    }

    async upsertClientStatementAtomic(intakeId: string, statement: Partial<ClientStatement>, userId: string) {
        return await (this.db as any).clientStatement.upsert({
            where: { intakeId },
            update: {
                ...statement,
                updatedAt: new Date()
            },
            create: {
                ...statement as any,
                intakeId
            }
        });
    }

    async syncClinicalCase(params: {
        caseId: string;
        clientId: string;
        localVersion: number;
        data: any;
        events: any[];
    }) {
        // Use raw query for custom RPC logic if not easily mapped
        return await this.db.$executeRaw`SELECT sync_clinical_case(${params.caseId}, ${params.clientId}, ${params.localVersion}, ${params.data}, ${params.events})`;
    }
}

export const intakeRepository = new IntakeRepository();
