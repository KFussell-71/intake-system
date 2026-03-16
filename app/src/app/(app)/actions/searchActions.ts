'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

export interface SearchResult {
    type: 'client' | 'report' | 'document';
    id: string;
    title: string;
    subtitle: string;
    link: string;
    metadata?: any;
}

/**
 * Server Action: Global search using Prisma.
 * MIGRATED FROM Supabase
 */
export async function globalSearchAction(query: string, type: 'clients' | 'reports' | 'documents' | 'all' = 'all', limit: number = 20) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    const results: SearchResult[] = [];
    const sanitizedQuery = query.trim();

    if (!sanitizedQuery) return { success: true, results: [], total: 0 };

    try {
        // 1. Search Clients
        if (type === 'clients' || type === 'all') {
            const clients = await prisma.client.findMany({
                where: {
                    OR: [
                        { name: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { email: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { phone: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                },
                include: {
                    intakes: {
                        select: {
                            id: true,
                            status: true,
                            reportDate: true,
                            createdAt: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                },
                take: limit
            });

            results.push(...clients.map((c: any) => ({
                type: 'client' as const,
                id: c.id,
                title: c.name,
                subtitle: c.email || c.phone || 'No contact info',
                link: `/clients/${c.id}`,
                metadata: {
                    ...c,
                    latest_intake: c.intakes?.[0] || null
                }
            })));
        }

        // 2. Search Intakes (Reports)
        if (type === 'reports' || type === 'all') {
            const intakes = await prisma.intake.findMany({
                where: {
                    OR: [
                        { client: { name: { contains: sanitizedQuery, mode: 'insensitive' } } },
                        { status: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                },
                include: { client: true },
                take: limit
            });

            results.push(...intakes.map(i => ({
                type: 'report' as const,
                id: i.id,
                title: `Report for ${i.client.name}`,
                subtitle: `Status: ${i.status} | ${i.reportDate.toLocaleDateString()}`,
                link: `/reports/${i.id}`,
                metadata: i
            })));
        }

        // 3. Search Documents
        if (type === 'documents' || type === 'all') {
            const docs = await prisma.document.findMany({
                where: {
                    name: { contains: sanitizedQuery, mode: 'insensitive' }
                },
                take: limit
            });

            results.push(...docs.map(d => ({
                type: 'document' as const,
                id: d.id,
                title: d.name,
                subtitle: `${d.type} | ${d.uploadedAt.toLocaleDateString()}`,
                link: `/clients/${d.clientId}#documents`,
                metadata: d
            })));
        }

        // Audit the search
        await auditService.log({
            userId: auth.userId,
            action: 'READ',
            entityType: 'search',
            entityId: 'global',
            details: { query: sanitizedQuery, resultCount: results.length }
        });

        return { 
            success: true, 
            results: results.slice(0, limit), 
            total: results.length 
        };

    } catch (error: any) {
        console.error('Global Search Error:', error);
        return { success: false, error: error.message };
    }
}
