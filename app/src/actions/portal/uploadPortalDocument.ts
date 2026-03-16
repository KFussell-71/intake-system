'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/services/auditService';

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
 * Server Action: Upload Document from Portal using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function uploadPortalDocument(
    fileName: string,
    fileContent: string, // Base64 encoded
    contentType: string,
    requestId?: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    try {
        // 1. Get and validate portal access using Prisma
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { id: auth.userId },
            select: { clientId: true, isActive: true, expiresAt: true, revokedAt: true }
        });

        if (!portalAccess) {
            return { success: false, error: 'Portal access not found' };
        }

        // 2. SECURITY: Verify access is active
        if (!portalAccess.isActive || portalAccess.revokedAt) {
            return { success: false, error: 'Portal access has been revoked' };
        }

        if (new Date(portalAccess.expiresAt) < new Date()) {
            return { success: false, error: 'Portal access has expired' };
        }

        // 3. Decode base64 content
        let fileBuffer: Buffer;
        try {
            fileBuffer = Buffer.from(fileContent, 'base64');
        } catch {
            return { success: false, error: 'Invalid file content' };
        }

        // 4. SECURITY: Validate file size
        if (fileBuffer.length > MAX_FILE_SIZE) {
            return {
                success: false,
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            };
        }

        // 5. SECURITY: Validate file type
        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
            return {
                success: false,
                error: `File type not allowed. Accepted: PDF, JPG, PNG, GIF, WebP`
            };
        }

        // 6. SECURITY: Sanitize filename
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // 7. Upload to storage via Supabase
        const clientId = portalAccess.clientId;
        const filePath = `client-${clientId}/portal-uploads/${uuidv4()}-${sanitizedFileName}`;

        const supabase = await createClient();
        const { error: storageError } = await supabase.storage
            .from('client-documents')
            .upload(filePath, fileBuffer, {
                contentType,
                upsert: false
            });

        if (storageError) {
            console.error('[PORTAL] Storage upload error:', storageError);
            return { success: false, error: 'Upload failed. Please try again.' };
        }

        // 8. DB Operations in a transaction
        await prisma.$transaction(async (tx: any) => {
            // 9. Create document record
            const newDoc = await tx.document.create({
                data: {
                    clientId,
                    name: sanitizedFileName,
                    type: contentType,
                    url: filePath,
                    size: fileBuffer.length
                }
            });

            // 10. Link to Document Request if provided
            if (requestId) {
                await tx.documentRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'uploaded',
                        documentId: newDoc.id
                    }
                });
            }

            // 11. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'document',
                entityId: newDoc.id,
                details: { source: 'portal_upload', fileName: sanitizedFileName, filePath, requestId }
            });

            // 12. Log portal activity (Legacy compatibility)
            await tx.portalActivity.create({
                data: {
                    clientId,
                    userId: auth.userId!,
                    action: 'DOCUMENT_UPLOADED',
                    metadata: {
                        filename: sanitizedFileName,
                        content_type: contentType,
                        size_bytes: fileBuffer.length,
                        path: filePath
                    }
                }
            });
        });

        return {
            success: true,
            message: 'Document uploaded successfully',
            path: filePath
        };

    } catch (error: any) {
        console.error('[PORTAL] Upload Error:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
