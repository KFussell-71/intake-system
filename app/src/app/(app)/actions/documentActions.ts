'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Server Action: Get client documents with signed URLs.
 */
export async function getClientDocumentsAction(clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    try {
        const docs = await prisma.document.findMany({
            where: { clientId },
            orderBy: { uploadedAt: 'desc' }
        });

        const supabase = await createClient();

        // Generate Signed URLs for secure viewing
        const docsWithUrls = await Promise.all(docs.map(async (doc) => {
            const { data } = await supabase.storage
                .from('client-documents')
                .createSignedUrl(doc.url, 3600); // 1 hour expiry

            return {
                ...doc,
                signedUrl: data?.signedUrl
            };
        }));

        return { success: true, data: docsWithUrls };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Upload client document record + storage.
 */
export async function uploadDocumentAction(
    clientId: string,
    fileName: string,
    fileContent: Buffer,
    contentType: string,
    size: number
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const supabase = await createClient();
        const fileExt = fileName.split('.').pop();
        const storagePath = `${clientId}/${uuidv4()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('client-documents')
            .upload(storagePath, fileContent, {
                contentType,
                upsert: false
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 2. Create DB Record
        const document = await prisma.document.create({
            data: {
                clientId,
                name: fileName,
                url: storagePath,
                type: contentType,
                size,
                uploadedById: auth.userId
            }
        });

        // 3. Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'document',
            entityId: document.id,
            details: { clientId, fileName }
        });

        return { success: true, data: document };
    } catch (error: any) {
        console.error('Document Upload Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete client document.
 */
export async function deleteDocumentAction(documentId: string, storageUrl: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const supabase = await createClient();

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('client-documents')
            .remove([storageUrl]);

        if (storageError) console.error('Storage delete warning:', storageError);

        // 2. Delete from DB
        await prisma.document.delete({
            where: { id: documentId }
        });

        // 3. Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'DELETE',
            entityType: 'document',
            entityId: documentId,
            details: { storageUrl }
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
