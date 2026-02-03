/**
 * Document Management Service
 * 
 * Handles document upload, versioning, and management using Supabase Storage
 */

import { supabase } from '@/lib/supabase/client';

export interface Document {
    id: string;
    client_id?: string;
    intake_id?: string;
    uploaded_by: string;
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    category?: string;
    version: number;
    parent_document_id?: string;
    ocr_text?: string;
    metadata?: any;
    created_at: string;
    deleted_at?: string;
}

const STORAGE_BUCKET = 'documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload a document
 */
export async function uploadDocument(params: {
    file: File;
    clientId?: string;
    intakeId?: string;
    category?: string;
    userId: string;
}): Promise<{ data?: Document; error?: any }> {
    try {
        // Validate file size
        if (params.file.size > MAX_FILE_SIZE) {
            return { error: 'File size exceeds 10MB limit' };
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${params.clientId || 'general'}/${timestamp}-${sanitizedName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, params.file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            return { error: uploadError };
        }

        // Create database record
        const { data, error } = await supabase
            .from('documents')
            .insert({
                client_id: params.clientId,
                intake_id: params.intakeId,
                uploaded_by: params.userId,
                filename: storagePath,
                original_filename: params.file.name,
                file_size: params.file.size,
                mime_type: params.file.type,
                storage_path: uploadData.path,
                category: params.category,
                version: 1
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { error };
    }
}

/**
 * Get documents for a client
 */
export async function getClientDocuments(clientId: string) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Get document download URL
 */
export async function getDocumentUrl(storagePath: string) {
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    return data.publicUrl;
}

/**
 * Download document
 */
export async function downloadDocument(storagePath: string) {
    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);

    return { data, error };
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(documentId: string) {
    const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId);

    return { error };
}

/**
 * Create new version of document
 */
export async function createDocumentVersion(params: {
    parentDocumentId: string;
    file: File;
    userId: string;
}): Promise<{ data?: Document; error?: any }> {
    try {
        // Get parent document
        const { data: parentDoc, error: parentError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', params.parentDocumentId)
            .single();

        if (parentError || !parentDoc) {
            return { error: 'Parent document not found' };
        }

        // Upload new version
        const timestamp = Date.now();
        const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${parentDoc.client_id || 'general'}/${timestamp}-v${parentDoc.version + 1}-${sanitizedName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, params.file);

        if (uploadError) {
            return { error: uploadError };
        }

        // Create new version record
        const { data, error } = await supabase
            .from('documents')
            .insert({
                client_id: parentDoc.client_id,
                intake_id: parentDoc.intake_id,
                uploaded_by: params.userId,
                filename: storagePath,
                original_filename: params.file.name,
                file_size: params.file.size,
                mime_type: params.file.type,
                storage_path: uploadData.path,
                category: parentDoc.category,
                version: parentDoc.version + 1,
                parent_document_id: params.parentDocumentId
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { error };
    }
}

/**
 * Get document versions
 */
export async function getDocumentVersions(documentId: string) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
        .is('deleted_at', null)
        .order('version', { ascending: false });

    return { data, error };
}

/**
 * Create shareable link
 */
export async function createShareLink(params: {
    documentId: string;
    userId: string;
    expiresInDays?: number;
}): Promise<{ token?: string; error?: any }> {
    const token = generateShareToken();
    const expiresAt = params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { error } = await supabase
        .from('document_shares')
        .insert({
            document_id: params.documentId,
            shared_by: params.userId,
            share_token: token,
            expires_at: expiresAt
        });

    if (error) {
        return { error };
    }

    return { token };
}

/**
 * Get document by share token
 */
export async function getDocumentByShareToken(token: string) {
    const { data: share, error: shareError } = await supabase
        .from('document_shares')
        .select('*, documents(*)')
        .eq('share_token', token)
        .single();

    if (shareError || !share) {
        return { error: 'Invalid or expired share link' };
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { error: 'Share link has expired' };
    }

    return { data: share.documents };
}

/**
 * Generate random share token
 */
function generateShareToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
