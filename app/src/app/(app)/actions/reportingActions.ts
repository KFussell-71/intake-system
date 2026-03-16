"use server";

import { prisma, verifyAuthorization } from "@/lib/auth/authHelpersServer";
import { auditService } from "@/services/auditService";

/**
 * Server Action: Generate Client CSV using Prisma.
 * Restricted to Admins and Supervisors.
 */
export async function generateClientCSV() {
    const authz = await verifyAuthorization(['admin', 'supervisor']);
    if (!authz.authorized || !authz.userId) throw new Error('Unauthorized');

    try {
        const data = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (!data || data.length === 0) return null;

        // Convert to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(d => Object.values(d as any).map(v => `"${v ?? ''}"`).join(','));
        const csv = [headers, ...rows].join('\n');

        // Audit Export
        await auditService.log({
            userId: authz.userId,
            action: 'EXPORT',
            entityType: 'client_list',
            entityId: 'all',
            details: { count: data.length, format: 'csv' }
        });

        return csv;
    } catch (error: any) {
        console.error('Error generating client CSV:', error);
        return null;
    }
}

/**
 * Server Action: Generate Intake Metadata CSV using Prisma.
 * Restricted to Admins and Supervisors.
 */
export async function generateIntakeMetadataCSV() {
    const authz = await verifyAuthorization(['admin', 'supervisor']);
    if (!authz.authorized || !authz.userId) throw new Error('Unauthorized');

    try {
        const data = await prisma.intake.findMany({
            select: {
                id: true,
                createdAt: true,
                status: true,
                preparedById: true,
                clientId: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!data || data.length === 0) return null;

        // Map fields to match legacy headers
        const headers = "id,created_at,status,user_id,client_id";
        const rows = data.map(d => [
            d.id,
            d.createdAt.toISOString(),
            d.status,
            d.preparedById ?? '',
            d.clientId
        ].map(v => `"${v}"`).join(','));

        const csv = [headers, ...rows].join('\n');

        // Audit Export
        await auditService.log({
            userId: authz.userId,
            action: 'EXPORT',
            entityType: 'intake_metadata_list',
            entityId: 'all',
            details: { count: data.length, format: 'csv' }
        });

        return csv;
    } catch (error: any) {
        console.error('Error generating intake metadata CSV:', error);
        return null;
    }
}
