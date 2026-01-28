'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { DocumentService } from '@/services/DocumentService';
import { ActionButton } from '@/components/ui/ActionButton';
import { createClient } from '@/lib/supabase';

interface DocumentManagerProps {
    clientId: string;
}

export function DocumentManager({ clientId }: DocumentManagerProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const docs = await DocumentService.getClientDocuments(clientId);
            setDocuments(docs);
        } catch (err) {
            console.error(err);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [clientId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            setError('File size too large (max 10MB)');
            return;
        }

        try {
            setUploading(true);
            setError('');

            // Get current user (simple check, better in context)
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            await DocumentService.uploadDocument(clientId, file, user.id);
            await loadDocuments(); // Refresh list
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await DocumentService.deleteDocument(id, url);
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
            setError('Failed to delete document');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Client Documents</h3>
                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="application/pdf,image/*,.doc,.docx"
                    />
                    <ActionButton
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={uploading}
                        icon={<Upload className="w-4 h-4" />}
                    >
                        Upload Scan
                    </ActionButton>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <DocumentList documents={documents} onDelete={handleDelete} />
            )}
        </div>
    );
}
