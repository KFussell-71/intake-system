'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, AlertCircle, PenTool } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { ActionButton } from '@/components/ui/ActionButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { FormSignerModal } from './FormSignerModal';
import { getClientDocumentsAction, uploadDocumentAction, deleteDocumentAction } from '@/app/(app)/actions/documentActions';

interface DocumentManagerProps {
    clientId: string;
}

/**
 * Document Manager Component (Refactored)
 * 
 * Migrated from direct Supabase browser client and legacy DocumentService
 * to secure Server Actions.
 */
export function DocumentManager({ clientId }: DocumentManagerProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [showFormSigner, setShowFormSigner] = useState(false);
    const [signatureData, setSignatureData] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const result = await getClientDocumentsAction(clientId);
            if (result.success && result.data) {
                setDocuments(result.data);
            } else {
                setError(result.error || 'Failed to load documents');
            }
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

            // Convert to Buffer for Server Action
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const result = await uploadDocumentAction(
                clientId,
                file.name,
                buffer,
                file.type,
                file.size
            );

            if (result.success) {
                await loadDocuments(); // Refresh list
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSignatureSave = async () => {
        if (!signatureData) return;

        try {
            setUploading(true);
            setError('');

            // Convert Base64 using fetch
            const res = await fetch(signatureData);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const fileName = `signature_${new Date().toISOString()}.png`;

            const result = await uploadDocumentAction(
                clientId,
                fileName,
                buffer,
                'image/png',
                buffer.length
            );

            if (result.success) {
                await loadDocuments();
                setShowSignaturePad(false);
                setSignatureData(''); // Reset
            } else {
                throw new Error(result.error || 'Signature upload failed');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Signature upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            const result = await deleteDocumentAction(id, url);
            if (result.success) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            } else {
                setError(result.error || 'Failed to delete document');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to delete document');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Client Documents</h3>
                <div className="flex gap-2 items-center relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="application/pdf,image/*,.doc,.docx"
                    />

                    {/* New Sign Form Button */}
                    <ActionButton
                        size="sm"
                        variant="primary"
                        onClick={() => setShowFormSigner(true)}
                        icon={<div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center text-[10px] font-bold">Pf</div>}
                    >
                        Sign Form
                    </ActionButton>

                    <ActionButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowSignaturePad(true)}
                        isLoading={uploading}
                        icon={<PenTool className="w-4 h-4" />}
                    >
                        Upload Sig
                    </ActionButton>
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

            {/* Form Signer Modal */}
            <FormSignerModal
                clientId={clientId}
                isOpen={showFormSigner}
                onClose={() => setShowFormSigner(false)}
                onSuccess={() => {
                    loadDocuments();
                }}
            />

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

            {/* Signature Dialog */}
            <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Capture Signature</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <SignaturePad onSignatureChange={(sig: string | null) => setSignatureData(sig || '')} />

                        <div className="flex justify-end space-x-2">
                            <ActionButton onClick={handleSignatureSave} isLoading={uploading} disabled={!signatureData}>
                                Save Signature
                            </ActionButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
