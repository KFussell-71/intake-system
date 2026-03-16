'use server';

import { prisma, verifyAuthentication } from "@/lib/auth/authHelpersServer";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";
import { auditService } from "@/services/auditService";

/**
 * SECURITY: File Upload Validation Constants
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

/**
 * Server Action: Upload client document.
 * MIGRATED WITH AUDITING
 */
export async function uploadClientDocument(
    clientId: string,
    fileName: string,
    fileContent: Buffer,
    contentType: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: "Unauthorized: Authentication required" };
    }

    if (fileContent.length > MAX_FILE_SIZE) {
        return {
            success: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
            success: false,
            error: `File type not allowed. Permitted types: ${ALLOWED_MIME_TYPES.join(', ')}`
        };
    }

    // Security Check: Magic Bytes
    const isPdf = fileContent.subarray(0, 5).toString('ascii') === '%PDF-';
    const isJpeg = fileContent[0] === 0xFF && fileContent[1] === 0xD8 && fileContent[2] === 0xFF;
    const isPng = fileContent[0] === 0x89 && fileContent[1] === 0x50 && fileContent[2] === 0x4E && fileContent[3] === 0x47;

    if ((contentType === 'application/pdf' && !isPdf) ||
        (contentType === 'image/jpeg' && !isJpeg) ||
        (contentType === 'image/png' && !isPng)) {
        return { success: false, error: "Security Error: File content does not match extension." };
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    try {
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                OR: [
                    { assignedToId: auth.userId },
                    { createdById: auth.userId },
                    { profiles: { some: { id: auth.userId, role: 'admin' } } } // Allow admins
                ]
            },
            select: { id: true }
        });

        if (!client && auth.role !== 'admin' && auth.role !== 'supervisor') {
            return {
                success: false,
                error: "Access denied: Unauthorized to upload for this client"
            };
        }

        const supabase = await createClient();
        const filePath = `client-${clientId}/documents/${uuidv4()}-${sanitizedFileName}`;

        const { error: storageError } = await supabase.storage
            .from('reports')
            .upload(filePath, fileContent, {
                contentType,
                upsert: false
            });

        if (storageError) {
            return { success: false, error: "Upload failed." };
        }

        // 1. Unified Audit Log
        await auditService.log({
            userId: auth.userId!,
            action: 'CREATE',
            entityType: 'document',
            entityId: filePath,
            details: { clientId, fileName: sanitizedFileName }
        });

        // 2. Legacy Event Log
        await prisma.intakeEvent.create({
            data: {
                intakeId: "00000000-0000-0000-0000-000000000000",
                eventType: 'document_uploaded',
                newValue: filePath,
                changedBy: auth.userId!,
                fieldPath: "documents"
            }
        });

        return { success: true, path: filePath };

    } catch (error: any) {
        console.error('Upload Error:', error);
        return { success: false, error: error.message };
    }
}
