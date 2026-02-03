'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    getClientDocuments,
    deleteDocument,
    getDocumentUrl,
    Document
} from '@/lib/documents/documentService';
import { Button } from '@/components/ui/button';
import { DocumentPreviewDialog } from './DocumentPreviewDialog';

interface DocumentListProps {
    clientId: string;
    refreshTrigger?: number; // Prop to trigger refresh from parent
}

export function DocumentList({ clientId, refreshTrigger }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; mimeType: string } | null>(null);

    const fetchDocs = async () => {
        setLoading(true);
        const { data, error } = await getClientDocuments(clientId);
        if (error) {
            toast.error('Failed to load documents');
            console.error(error);
        } else {
            setDocuments(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDocs();
    }, [clientId, refreshTrigger]);

    const handlePreview = async (doc: Document) => {
        let url = '';
        if (doc.storage_path) {
            url = await getDocumentUrl(doc.storage_path);
        }

        if (url) {
            setPreviewDoc({
                title: doc.original_filename,
                url,
                mimeType: doc.mime_type
            });
        } else {
            toast.error('Could not generate preview link');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        const { error } = await deleteDocument(id);
        if (error) {
            toast.error('Failed to delete document');
        } else {
            toast.success('Document deleted');
            fetchDocs();
        }
    };

    if (loading && documents.length === 0) {
        return (
            <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No documents uploaded yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium hidden sm:table-cell">Type</th>
                            <th className="px-6 py-3 font-medium hidden md:table-cell">Size</th>
                            <th className="px-6 py-3 font-medium hidden sm:table-cell">Uploaded</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="truncate max-w-[200px]" title={doc.original_filename}>
                                            {doc.original_filename}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                                    {doc.category || 'General'}
                                </td>
                                <td className="px-6 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">
                                    {(doc.file_size / 1024).toFixed(0)} KB
                                </td>
                                <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                            onClick={() => handlePreview(doc)}
                                            title="Preview"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-green-600"
                                            onClick={() => window.open(doc.storage_path, '_blank')}
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                                            onClick={() => handleDelete(doc.id)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <DocumentPreviewDialog
                open={!!previewDoc}
                onOpenChange={(open) => !open && setPreviewDoc(null)}
                document={previewDoc}
            />
        </>
    );
}
