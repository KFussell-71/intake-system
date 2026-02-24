'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

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
 * SECURITY: Upload Document from Portal
 * 
 * This action allows portal clients to upload documents for their own case.
 * 
 * SECURITY CONTROLS:
 * 1. Validates active portal access
 * 2. File size and type validation
 * 3. Client can only upload to their own folder
 * 4. Full portal activity logging
 * 
 * @param fileName - Original file name
 * @param fileContent - File content as base64 string
 * @param contentType - MIME type
 */
export async function uploadPortalDocument(
    fileName: string,
    fileContent: string, // Base64 encoded
    contentType: string,
    requestId?: string
) {
    const supabase = await createClient();

    // 1. SECURITY: Verify current user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    // 2. Get and validate portal access
    const { data: clientLink, error: linkError } = await supabase
        .from('client_users')
        .select('client_id, is_active, expires_at, revoked_at')
        .eq('id', user.id)
        .single();

    if (linkError || !clientLink) {
        return { success: false, error: 'Portal access not found' };
    }

    // 3. SECURITY: Verify access is active
    if (!clientLink.is_active || clientLink.revoked_at) {
        return { success: false, error: 'Portal access has been revoked' };
    }

    if (new Date(clientLink.expires_at) < new Date()) {
        return { success: false, error: 'Portal access has expired' };
    }

    // 4. Decode base64 content
    let fileBuffer: Buffer;
    try {
        fileBuffer = Buffer.from(fileContent, 'base64');
    } catch {
        return { success: false, error: 'Invalid file content' };
    }

    // 5. SECURITY: Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
        return {
            success: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
    }

    // 6. SECURITY: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
            success: false,
            error: `File type not allowed. Accepted: PDF, JPG, PNG, GIF, WebP`
        };
    }

    // 7. SECURITY: Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 8. Upload to storage
    const clientId = clientLink.client_id;
    const filePath = `client-${clientId}/portal-uploads/${uuidv4()}-${sanitizedFileName}`;

    const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(filePath, fileBuffer, {
            contentType,
            upsert: false
        });

    if (error) {
        console.error('[PORTAL] Storage upload error:', error);
        return { success: false, error: 'Upload failed. Please try again.' };
    }

    // 9. Create document record
    // Note: Portal users aren't in profiles table, so we use url to track upload source
    // and don't set uploaded_by (which references profiles)
    const { data: newDoc, error: docError } = await supabase
        .from('documents')
        .insert({
            client_id: clientId,
            name: sanitizedFileName,
            type: contentType,
            url: filePath,
            size: fileBuffer.length
        })
        .select()
        .single();

    if (docError || !newDoc) {
        console.error('[PORTAL] Document record error:', docError);
        // Don't fail - file is uploaded
    } else if (requestId) {
        // 10. Link to Document Request
        const { error: reqError } = await supabase
            .from('document_requests')
            .update({
                status: 'uploaded',
                document_id: newDoc.id,
                // We keep requested_at as the original request time
            })
            .eq('id', requestId)
            .eq('client_id', clientId);

        if (reqError) {
            console.error('[PORTAL] Failed to link document to request:', reqError);
        }
    }

    if (docError) {
        console.error('[PORTAL] Document record error:', docError);
        // Don't fail - file is uploaded, record can be reconciled
    }

    // 10. Log portal activity
    await supabase.from('portal_activity').insert({
        client_id: clientId,
        user_id: user.id,
        action: 'DOCUMENT_UPLOADED',
        metadata: {
            filename: sanitizedFileName,
            content_type: contentType,
            size_bytes: fileBuffer.length,
            path: filePath
        }
    });

    return {
        success: true,
        message: 'Document uploaded successfully',
        path: filePath
    };
}
