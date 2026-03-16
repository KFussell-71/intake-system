import { BaseRepository } from './BaseRepository';

export interface ClientResume {
    id: string;
    clientId: string;
    intakeId: string;
    resumeId: string;
    resumeUrl: string;
    pdfUrl?: string | null;
    version: number;
    isActive: boolean;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateResumeData {
    clientId: string;
    intakeId: string;
    resumeId: string;
    resumeUrl: string;
    pdfUrl?: string;
    metadata?: any;
}

/**
 * MIGRATED TO PRISMA
 */
export class ResumeRepository extends BaseRepository {
    /**
     * Create a new resume record
     */
    async createResume(data: CreateResumeData, performerId?: string): Promise<ClientResume> {
        return await this.db.$transaction(async (tx) => {
            // Get current max version
            const latest = await tx.clientResume.findFirst({
                where: { clientId: data.clientId },
                orderBy: { version: 'desc' },
                select: { version: true }
            });

            const nextVersion = (latest?.version || 0) + 1;

            // Create record
            const resume = await tx.clientResume.create({
                data: {
                    clientId: data.clientId,
                    intakeId: data.intakeId,
                    resumeId: data.resumeId,
                    resumeUrl: data.resumeUrl,
                    pdfUrl: data.pdfUrl,
                    metadata: data.metadata || {},
                    version: nextVersion,
                    isActive: true
                }
            });

            // Log action
            await tx.resumeGenerationLog.create({
                data: {
                    resumeId: resume.id,
                    action: 'generated',
                    performedBy: performerId,
                    metadata: { version: nextVersion }
                }
            });

            return resume as any;
        });
    }

    /**
     * Get all resumes for a client
     */
    async getResumesByClient(clientId: string): Promise<ClientResume[]> {
        return await this.db.clientResume.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' }
        }) as any;
    }

    /**
     * Get the latest active resume for a client
     */
    async getLatestResume(clientId: string): Promise<ClientResume | null> {
        return await this.db.clientResume.findFirst({
            where: { clientId, isActive: true },
            orderBy: { createdAt: 'desc' }
        }) as any;
    }

    /**
     * Get a specific resume by ID
     */
    async getResumeById(resumeId: string): Promise<ClientResume | null> {
        return await this.db.clientResume.findUnique({
            where: { id: resumeId }
        }) as any;
    }

    /**
     * Update resume PDF URL after export
     */
    async updatePdfUrl(resumeId: string, pdfUrl: string, performerId?: string): Promise<void> {
        await this.db.clientResume.update({
            where: { id: resumeId },
            data: { pdfUrl }
        });

        await this.db.resumeGenerationLog.create({
            data: {
                resumeId,
                action: 'pdf_generated',
                performedBy: performerId
            }
        });
    }

    /**
     * Deactivate old resumes
     */
    async deactivateOldResumes(clientId: string, exceptResumeId?: string): Promise<void> {
        await this.db.clientResume.updateMany({
            where: {
                clientId,
                id: exceptResumeId ? { not: exceptResumeId } : undefined
            },
            data: { isActive: false }
        });
    }

    /**
     * Delete a resume
     */
    async deleteResume(resumeId: string, performerId?: string): Promise<void> {
        // Technically we might want to soft delete or just log before hard delete
        // But following the previous implementation's hard delete
        await this.db.clientResume.delete({
            where: { id: resumeId }
        });
    }

    /**
     * Get resume statistics for a client
     */
    async getResumeStats(clientId: string): Promise<{
        total: number;
        active: number;
        lastGenerated?: Date;
    }> {
        const resumes = await this.db.clientResume.findMany({
            where: { clientId },
            select: { isActive: true, createdAt: true }
        });

        return {
            total: resumes.length,
            active: resumes.filter(r => r.isActive).length,
            lastGenerated: resumes.length > 0 ? resumes[0].createdAt : undefined
        };
    }
}

export const resumeRepository = new ResumeRepository();
