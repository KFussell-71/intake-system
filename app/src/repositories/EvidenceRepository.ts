import { BaseRepository } from '@/repositories/BaseRepository';

export interface AccreditationStandard {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
}

export interface EvidencePacket {
    id: string;
    title: string;
    status: 'generating' | 'complete' | 'failed' | string;
    generatedAt: Date;
    content: any;
}

/**
 * MIGRATED TO PRISMA
 * EvidenceRepository handles accreditation and compliance data.
 */
export class EvidenceRepository extends BaseRepository {

    /**
     * getStandards
     * Fetches the checklist of rules we are auditing against.
     */
    async getStandards(): Promise<AccreditationStandard[]> {
        try {
            const data = await this.db.accreditationStandard.findMany({
                where: { active: true },
                orderBy: { code: 'asc' }
            });

            return data.map(s => ({
                id: s.id,
                code: s.code,
                name: s.name,
                description: s.description,
                category: s.category
            }));
        } catch (error: any) {
            this.handleError(error, 'EvidenceRepository.getStandards');
        }
    }

    /**
     * getEvidencePackets
     * Fetches historical binders.
     */
    async getEvidencePackets(): Promise<EvidencePacket[]> {
        try {
            const data = await this.db.evidencePacket.findMany({
                orderBy: { generatedAt: 'desc' }
            });

            return data.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                generatedAt: p.generatedAt,
                content: p.content
            }));
        } catch (error: any) {
            this.handleError(error, 'EvidenceRepository.getEvidencePackets');
        }
    }

    /**
     * createPacket (Stub for MVP)
     * In a real system, this would trigger a background job.
     */
    async createPacket(title: string): Promise<EvidencePacket | null> {
        try {
            const data = await this.db.evidencePacket.create({
                data: {
                    title,
                    status: 'complete', // Simulating instant generation for demo
                    content: {
                        summary: "Compliance Review 2026-Q1",
                        standards_reviewed: 3,
                        overall_score: 0.98
                    }
                }
            });

            return {
                id: data.id,
                title: data.title,
                status: data.status,
                generatedAt: data.generatedAt,
                content: data.content
            };
        } catch (error: any) {
            this.handleError(error, 'EvidenceRepository.createPacket');
        }
    }
}

export const evidenceRepository = new EvidenceRepository();
