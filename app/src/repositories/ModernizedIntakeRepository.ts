import { prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';

export class ModernizedIntakeRepository {

    // --- 1. Intake Sections (Workflow) ---
    async getSectionStatuses(intakeId: string) {
        return await prisma.intakeSection.findMany({
            where: { intakeId }
        });
    }

    async updateSectionStatus(intakeId: string, sectionName: string, status: string, userId: string) {
        return await prisma.intakeSection.upsert({
            where: {
                intakeId_sectionName: {
                    intakeId,
                    sectionName
                }
            },
            create: {
                intakeId,
                sectionName,
                status,
                lastUpdatedBy: userId
            },
            update: {
                status,
                lastUpdatedBy: userId,
                updatedAt: new Date()
            }
        });
    }

    // --- 2. Observations (Clinical/Client Voice) ---
    async getObservations(intakeId: string, domain?: string) {
        return await prisma.observation.findMany({
            where: {
                intakeId,
                ...(domain ? { domain } : {})
            }
        });
    }

    async addObservation(data: {
        intakeId: string;
        clientId: string;
        domain: string;
        value: string;
        source: string;
        confidence?: string;
        authorUserId?: string;
    }) {
        return await prisma.observation.create({
            data
        });
    }

    async deleteObservation(observationId: string) {
        await prisma.observation.delete({
            where: { id: observationId }
        });
        return true;
    }

    // --- 3. Barriers (Relational Analytics) ---
    async getAllBarriers() {
        return await prisma.barrier.findMany({
            where: { active: true }
        });
    }

    async getIntakeBarriers(intakeId: string) {
        return await prisma.intakeBarrier.findMany({
            where: { intakeId },
            include: { barrier: true }
        });
    }

    async addIntakeBarrier(intakeId: string, clientId: string, barrierId: number, source: string, notes?: string) {
        return await prisma.intakeBarrier.create({
            data: {
                intakeId,
                clientId,
                barrierId,
                source,
                notes
            }
        });
    }

    async removeIntakeBarrier(intakeId: string, barrierId: number) {
        await prisma.intakeBarrier.deleteMany({
            where: {
                intakeId,
                barrierId
            }
        });
        return true;
    }

    // --- 4. Consent Workflow ---
    async createConsentDocument(data: {
        intakeId: string;
        clientId: string;
        type: string;
        templateVersion?: string;
        scopeText?: string;
        expiresAt?: Date;
        createdBy?: string;
    }) {
        return await prisma.consentDocument.create({
            data
        });
    }

    async addConsentSignature(data: {
        consentDocumentId: string;
        intakeId: string;
        clientId?: string;
        signerName: string;
        signerRole: string;
        signatureData?: string;
        method?: string;
        documentHash?: string;
        ipAddress?: string;
    }) {
        return await prisma.consentSignature.create({
            data
        });
    }

    async lockConsentDocument(documentId: string) {
        return await prisma.consentDocument.update({
            where: { id: documentId },
            data: { locked: true }
        });
    }

    // --- 5. Audit Ledger ---
    async logIntakeEvent(data: {
        intakeId: string;
        eventType: string;
        fieldPath?: string;
        oldValue?: string;
        newValue?: string;
        changedBy?: string;
    }) {
        return await prisma.intakeEvent.create({
            data
        });
    }
}

export const modernizedIntakeRepository = new ModernizedIntakeRepository();
