import { prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';

export interface ServiceProvider {
    id: string;
    name: string;
    category: string;
    description: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website?: string;
    status: 'active' | 'inactive' | 'full';
    capacity?: number;
}

export interface Referral {
    id: string;
    case_id: string;
    provider_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    referral_date: string;
    outcome_notes?: string;
    provider?: ServiceProvider;
}

export class ReferralService {
    private get db() {
        return prisma;
    }

    /**
     * Get all active service providers
     */
    async getProviders(): Promise<ServiceProvider[]> {
        try {
            const data = await this.db.serviceProvider.findMany({
                where: { status: 'active' },
                orderBy: { name: 'asc' }
            });

            return data.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                contact_email: p.contactEmail || undefined,
                contact_phone: p.contactPhone || undefined,
                address: p.address || undefined,
                website: p.website || undefined,
                status: p.status as any,
                capacity: p.capacity || undefined
            }));
        } catch (error) {
            console.error('Error fetching providers:', error);
            throw error;
        }
    }

    /**
     * Get referrals for a case
     */
    async getReferrals(caseId: string): Promise<Referral[]> {
        try {
            const data = await this.db.referral.findMany({
                where: { caseId },
                include: {
                    provider: true
                },
                orderBy: { referralDate: 'desc' }
            });

            return data.map((r: any) => ({
                id: r.id,
                case_id: r.caseId,
                provider_id: r.providerId,
                status: r.status as any,
                referral_date: r.referralDate.toISOString(),
                outcome_notes: r.outcomeNotes || undefined,
                provider: {
                    id: r.provider.id,
                    name: r.provider.name,
                    category: r.provider.category,
                    description: r.provider.description,
                    contact_email: r.provider.contactEmail || undefined,
                    contact_phone: r.provider.contactPhone || undefined,
                    address: r.provider.address || undefined,
                    website: r.provider.website || undefined,
                    status: r.provider.status as any,
                    capacity: r.provider.capacity || undefined
                }
            }));
        } catch (error) {
            console.error('Error fetching referrals:', error);
            throw error;
        }
    }

    /**
     * Create a new referral
     */
    async createReferral(data: { case_id: string; provider_id: string; outcome_notes?: string }): Promise<Referral> {
        try {
            const result = await this.db.referral.create({
                data: {
                    caseId: data.case_id,
                    providerId: data.provider_id,
                    outcomeNotes: data.outcome_notes,
                    status: 'pending'
                },
                include: {
                    provider: true
                }
            });

            return {
                id: result.id,
                case_id: result.caseId,
                provider_id: result.providerId,
                status: result.status as any,
                referral_date: result.referralDate.toISOString(),
                outcome_notes: result.outcomeNotes || undefined,
                provider: {
                    id: result.provider.id,
                    name: result.provider.name,
                    category: result.provider.category,
                    description: result.provider.description,
                    status: result.provider.status as any
                } as any
            };
        } catch (error) {
            console.error('Error creating referral:', error);
            throw error;
        }
    }

    /**
     * Update referral status
     */
    async updateReferralStatus(referralId: string, status: string, notes?: string): Promise<void> {
        try {
            await this.db.referral.update({
                where: { id: referralId },
                data: {
                    status,
                    outcomeNotes: notes
                }
            });
        } catch (error) {
            console.error('Error updating referral status:', error);
            throw error;
        }
    }
}

export const referralService = new ReferralService();
