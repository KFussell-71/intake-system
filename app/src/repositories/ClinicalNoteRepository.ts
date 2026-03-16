import { BaseRepository } from './BaseRepository';
import { ClinicalNote, ClinicalNoteFormData } from '@/types/clinical_note';

export class ClinicalNoteRepository extends BaseRepository {
    async getNoteById(id: string): Promise<ClinicalNote | null> {
        try {
            const data = await this.db.clinicalNote.findUnique({
                where: { id },
                include: {
                    author: {
                        select: { firstName: true, lastName: true, username: true }
                    }
                }
            });

            if (!data) return null;

            return {
                ...data,
                author: data.author ? {
                    first_name: data.author.firstName!,
                    last_name: data.author.lastName!,
                    username: data.author.username!
                } : undefined,
                extra_data: data.extraData as any,
                template_type: data.templateType as any,
                is_finalized: data.isFinalized,
                finalized_at: data.finalizedAt?.toISOString() || null,
                created_at: data.createdAt.toISOString(),
                updated_at: data.updatedAt.toISOString()
            } as any;
        } catch (error: any) {
            this.handleError(error, 'getNoteById');
            return null;
        }
    }

    async getNotesByClient(clientId: string): Promise<ClinicalNote[]> {
        try {
            const logs = await this.db.clinicalNote.findMany({
                where: { clientId },
                include: {
                    author: {
                        select: { firstName: true, lastName: true, username: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return logs.map((data: any) => ({
                ...data,
                author: data.author ? {
                    first_name: data.author.firstName!,
                    last_name: data.author.lastName!,
                    username: data.author.username!
                } : undefined,
                extra_data: data.extraData as any,
                template_type: data.templateType as any,
                is_finalized: data.isFinalized,
                finalized_at: data.finalizedAt?.toISOString() || null,
                created_at: data.createdAt.toISOString(),
                updated_at: data.updatedAt.toISOString()
            } as any));
        } catch (error: any) {
            this.handleError(error, 'getNotesByClient');
            return [];
        }
    }

    async createNote(clientId: string, authorId: string, data: ClinicalNoteFormData): Promise<ClinicalNote> {
        try {
            const note = await this.db.clinicalNote.create({
                data: {
                    clientId,
                    authorId,
                    purpose: data.purpose,
                    templateType: data.template_type,
                    subjective: data.subjective,
                    objective: data.objective,
                    assessment: data.assessment,
                    plan: data.plan,
                    dataNarrative: data.data_narrative,
                    assessmentNarrative: data.assessment_narrative,
                    planNarrative: data.plan_narrative,
                    extraData: (data.extra_data as any) || {},
                    isFinalized: false
                }
            });
            return note as any;
        } catch (error: any) {
            this.handleError(error, 'createNote');
            throw error;
        }
    }

    async updateNote(id: string, authorId: string, data: Partial<ClinicalNoteFormData>): Promise<ClinicalNote> {
        try {
            const note = await this.db.clinicalNote.update({
                where: {
                    id,
                    authorId,
                    isFinalized: false
                },
                data: {
                    purpose: data.purpose,
                    templateType: data.template_type,
                    subjective: data.subjective,
                    objective: data.objective,
                    assessment: data.assessment,
                    plan: data.plan,
                    dataNarrative: data.data_narrative,
                    assessmentNarrative: data.assessment_narrative,
                    planNarrative: data.plan_narrative,
                    extraData: data.extra_data as any
                }
            });
            return note as any;
        } catch (error: any) {
            this.handleError(error, 'updateNote');
            throw error;
        }
    }

    async finalizeNote(id: string, authorId: string, signature: string): Promise<ClinicalNote> {
        try {
            const note = await this.db.clinicalNote.update({
                where: {
                    id,
                    authorId,
                    isFinalized: false
                },
                data: {
                    isFinalized: true,
                    finalizedAt: new Date(),
                    signature
                }
            });
            return note as any;
        } catch (error: any) {
            this.handleError(error, 'finalizeNote');
            throw error;
        }
    }
}

export const clinicalNoteRepository = new ClinicalNoteRepository();
