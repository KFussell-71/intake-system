"use server";

import { prisma, verifyAuthentication } from "@/lib/auth/authHelpersServer";
import { revalidatePath } from "next/cache";
import { auditService } from "@/services/auditService";

export interface AVResource {
    id?: string;
    name: string;
    address: string;
    phone: string;
    notes: string;
    triggers: string[];
}

/**
 * Server Action: Fetch resources using Prisma.
 */
export async function getResources() {
    try {
        const data = await prisma.aVResource.findMany({
            orderBy: { name: 'asc' }
        });
        return data as AVResource[];
    } catch (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
}

/**
 * Server Action: Create resource using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function createResource(resource: AVResource) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const data = await tx.aVResource.create({
                data: {
                    name: resource.name,
                    address: resource.address,
                    phone: resource.phone,
                    notes: resource.notes,
                    triggers: resource.triggers
                }
            });

            // 1. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'av_resource',
                entityId: data.id,
                details: { name: data.name }
            });

            // 2. Legacy Audit Log
            await tx.intakeEvent.create({
                data: {
                    intakeId: "00000000-0000-0000-0000-000000000000",
                    eventType: 'resource_created',
                    newValue: data.name,
                    changedBy: auth.userId!,
                    fieldPath: "av_resources"
                }
            });

            return data;
        });

        revalidatePath("/supervisor/resources");
        return result;
    } catch (error: any) {
        throw new Error(`Failed to create resource: ${error.message}`);
    }
}

/**
 * Server Action: Update resource using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function updateResource(id: string, resource: Partial<AVResource>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const data = await tx.aVResource.update({
                where: { id },
                data: {
                    name: resource.name,
                    address: resource.address,
                    phone: resource.phone,
                    notes: resource.notes,
                    triggers: resource.triggers
                }
            });

            // 1. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'av_resource',
                entityId: id,
                details: { updatedFields: Object.keys(resource) }
            });

            // 2. Legacy Audit Log
            await tx.intakeEvent.create({
                data: {
                    intakeId: "00000000-0000-0000-0000-000000000000",
                    eventType: 'resource_updated',
                    newValue: id,
                    changedBy: auth.userId!,
                    fieldPath: "av_resources"
                }
            });

            return data;
        });

        revalidatePath("/supervisor/resources");
        return result;
    } catch (error: any) {
        throw new Error(`Failed to update resource: ${error.message}`);
    }
}

/**
 * Server Action: Delete resource using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function deleteResource(id: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        await prisma.$transaction(async (tx: any) => {
            await tx.aVResource.delete({
                where: { id }
            });

            // 1. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'DELETE',
                entityType: 'av_resource',
                entityId: id
            });

            // 2. Legacy Audit Log
            await tx.intakeEvent.create({
                data: {
                    intakeId: "00000000-0000-0000-0000-000000000000",
                    eventType: 'resource_deleted',
                    newValue: id,
                    changedBy: auth.userId!,
                    fieldPath: "av_resources"
                }
            });
        });

        revalidatePath("/supervisor/resources");
    } catch (error: any) {
        throw new Error(`Failed to delete resource: ${error.message}`);
    }
}
