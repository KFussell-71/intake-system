'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { signPdf } from '@/lib/pdf/signer';
import { documentRepository } from '@/repositories/DocumentRepository';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Sign a document (HIPAA/Privacy) using Prisma and standard auditing.
 * MIGRATED WITH AUDITING
 */
export async function signDocument(
    clientId: string,
    templateName: 'HIPAA_AuthorizationForm.pdf' | 'Notice-Of-Privacy-Practices-and-Office-Policy.pdf',
    signatureBase64: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Get Client Data for Printed Name via Prisma
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { name: true }
        });

        if (!client) throw new Error('Client not found');

        const printedName = client.name;
        const dateString = new Date().toLocaleDateString();

        // 2. Generate Signed PDF Buffer
        const signedPdfBuffer = await signPdf({
            signatureBase64,
            templateName,
            date: dateString,
            printedName
        });

        // 3. Upload to Storage via Supabase SSR client
        const fileName = `${clientId}/Signed_${templateName.replace('.pdf', '')}_${Date.now()}.pdf`;
        const supabase = await createClient();

        const { error: uploadError } = await supabase.storage
            .from('client-documents')
            .upload(fileName, signedPdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 4. Create DB Record via Prisma
        const doc = await documentRepository.create({
            clientId: clientId,
            name: `Signed: ${templateName}`,
            url: fileName,
            type: 'application/pdf',
            size: signedPdfBuffer.length,
            uploadedById: auth.userId
        });

        // 5. Unified Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'SIGN',
            entityType: 'document',
            entityId: doc.id,
            details: { templateName, fileName }
        });

        return { success: true, document: doc };

    } catch (error: any) {
        console.error('Signing error:', error);
        return { success: false, error: error.message };
    }
}
