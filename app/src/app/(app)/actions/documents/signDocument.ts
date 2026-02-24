
'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guard';
import { signPdf } from '@/lib/pdf/signer';
import { v4 as uuidv4 } from 'uuid';
import { documentRepository } from '@/repositories/DocumentRepository';

export async function signDocument(
    clientId: string,
    templateName: 'HIPAA_AuthorizationForm.pdf' | 'Notice-Of-Privacy-Practices-and-Office-Policy.pdf',
    signatureBase64: string
) {
    try {
        // 1. Auth Check
        const { user, supabase } = await requireAuth();

        // 2. Get Client Data for Printed Name
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', clientId)
            .single();

        if (clientError || !client) throw new Error('Client not found');

        const printedName = `${client.first_name} ${client.last_name}`;
        const dateString = new Date().toLocaleDateString();

        // 3. Generate Signed PDF Buffer
        const signedPdfBuffer = await signPdf({
            signatureBase64,
            templateName,
            date: dateString,
            printedName
        });

        // 4. Upload to Storage
        const fileName = `${clientId}/Signed_${templateName.replace('.pdf', '')}_${Date.now()}.pdf`;

        const { error: uploadError } = await supabase.storage
            .from('client-documents')
            .upload(fileName, signedPdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 5. Create DB Record
        const doc = await documentRepository.create({
            client_id: clientId,
            name: `Signed: ${templateName}`,
            url: fileName,
            type: 'application/pdf',
            size: signedPdfBuffer.length,
            uploaded_by: user.id
        });

        return { success: true, document: doc };

    } catch (error: any) {
        console.error('Signing error:', error);
        return { success: false, error: error.message };
    }
}
