'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * SECURITY: Get Portal Client Data using Prisma.
 * Returns a SANITIZED view of the client's own data.
 * MIGRATED WITH AUDITING
 */
export async function getPortalClientData() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized', data: null };
    }

    try {
        // 1. Get the portal access verification using Prisma
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { id: auth.userId },
            include: {
                client: {
                    include: {
                        intakes: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                id: true,
                                status: true,
                                reportDate: true,
                                createdAt: true
                            }
                        },
                        trackingMilestones: {
                            orderBy: [
                                { stepOrder: 'asc' },
                                { createdAt: 'asc' }
                            ]
                        },
                        documents: {
                            orderBy: { uploadedAt: 'desc' },
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                uploadedAt: true
                            }
                        },
                        documentRequests: {
                            orderBy: { requestedAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!portalAccess) {
            return { success: false, error: 'Portal access not found', data: null };
        }

        // 2. SECURITY: Verify access is active and not expired
        if (!portalAccess.isActive || portalAccess.revokedAt) {
            return { success: false, error: 'Portal access has been revoked', data: null };
        }

        if (new Date(portalAccess.expiresAt) < new Date()) {
            return { success: false, error: 'Portal access has expired. Please contact your Case Manager.', data: null };
        }

        const client = portalAccess.client;
        const latestIntake = client.intakes[0] || null;

        // 3. Unified Audit Log (Access Track)
        await auditService.log({
            userId: auth.userId,
            action: 'READ',
            entityType: 'portal_data',
            entityId: client.id,
            details: { reason: 'portal_access_refresh' }
        });

        // 4. Return sanitized data
        return {
            success: true,
            error: null,
            data: {
                client: {
                    id: client.id,
                    name: client.name,
                    email: client.email ? maskEmail(client.email) : null,
                    phone: client.phone ? maskPhone(client.phone) : null,
                    address: client.address,
                    memberSince: client.createdAt
                },
                intake: latestIntake ? {
                    status: latestIntake.status,
                    reportDate: latestIntake.reportDate,
                    submittedAt: latestIntake.createdAt
                } : null,
                milestones: (client.trackingMilestones || []).map(m => ({
                    id: m.id,
                    milestone_name: m.milestoneName,
                    description: m.description,
                    step_order: m.stepOrder,
                    completion_date: m.completionDate,
                    created_at: m.createdAt
                })),
                documents: client.documents || [],
                documentRequests: client.documentRequests || [],
                accessInfo: {
                    expiresAt: portalAccess.expiresAt
                }
            }
        };

    } catch (error: any) {
        console.error('Portal Data Error:', error);
        return { success: false, error: 'Internal Server Error', data: null };
    }
}

/**
 * Mask email for privacy display
 */
function maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
        return '***@***';
    }
    const [local, domain] = email.split('@');
    if (!local || local.length <= 2) {
        return `${local?.[0] || '*'}***@${domain || '***'}`;
    }
    return `${local[0]}${local[1]}***@${domain}`;
}

/**
 * Mask phone for privacy display
 */
function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return `***-***-${digits.slice(-4)}`;
}
