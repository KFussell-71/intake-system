import { createClient } from '@/lib/supabase';
import { documentRepository } from '@/repositories/DocumentRepository';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
    static async uploadDocument(
        clientId: string,
        file: File,
        profileId: string
    ) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientId}/${uuidv4()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('client-documents')
            .upload(fileName, file);

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 2. Create DB Record
        return documentRepository.create({
            client_id: clientId,
            name: file.name,
            url: fileName,
            type: file.type,
            size: file.size,
            uploaded_by: profileId
        });
    }

    static async getClientDocuments(clientId: string) {
        const docs = await documentRepository.getByClient(clientId);
        const supabase = createClient();

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

        return docsWithUrls;
    }

    static async deleteDocument(id: string, url: string) {
        const supabase = createClient();

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('client-documents')
            .remove([url]);

        if (storageError) console.error('Storage delete warning:', storageError);

        // 2. Delete from DB
        await documentRepository.delete(id);
    }
}
