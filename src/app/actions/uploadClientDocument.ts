'use server';

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

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
    // Add more as needed
];

export async function uploadClientDocument(
    clientId: string,
    fileName: string,
    fileContent: Buffer,
    contentType: string
) {
    const supabase = await createClient();

    // 1. SECURITY: Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Unauthorized: Authentication required" };
    }

    // 2. SECURITY: Validate file size
    if (fileContent.length > MAX_FILE_SIZE) {
        return {
            success: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
    }

    // 3. SECURITY: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
            success: false,
            error: `File type not allowed. Permitted types: ${ALLOWED_MIME_TYPES.join(', ')}`
        };
    }

    // 4. SECURITY: Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 5. SECURITY: Verify user has access to this client (ownership check)
    const { data: clientAccess, error: accessError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .single();

    if (accessError || !clientAccess) {
        return {
            success: false,
            error: "Access denied: You are not authorized to upload documents for this client"
        };
    }

    // 6. Upload to private 'reports' bucket
    const filePath = `client-${clientId}/documents/${uuidv4()}-${sanitizedFileName}`;

    const { data, error } = await supabase.storage
        .from('reports')
        .upload(filePath, fileContent, {
            contentType,
            upsert: false // SECURITY: Prevent accidental overwrites
        });

    if (error) {
        console.error('[SECURITY] Storage upload error:', error);
        return { success: false, error: "Upload failed. Please try again." };
    }

    // 7. Log the upload action for audit trail
    // Note: This would insert into audit_logs table in production
    console.log(`[AUDIT] Document uploaded: ${filePath} by user ${user.id} for client ${clientId}`);

    return { success: true, path: filePath };
}
