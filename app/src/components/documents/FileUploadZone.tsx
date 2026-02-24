'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '@/lib/documents/documentService';
import { toast } from 'sonner';

interface FileUploadZoneProps {
    clientId: string;
    onUploadComplete: () => void;
    userId: string;
    intakeId?: string;
}

export function FileUploadZone({ clientId, onUploadComplete, userId, intakeId }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFile = async (file: File) => {
        // Validate type
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, PNG, or JPG.');
            return;
        }

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const { error: uploadError } = await uploadDocument({
                file,
                clientId,
                intakeId,
                userId,
                category: 'general' // Default category
            });

            if (uploadError) throw uploadError;

            toast.success('Document uploaded successfully');
            onUploadComplete();
        } catch (err: any) {
            console.error('Upload failed:', err);
            const msg = err.message || 'Failed to upload document';
            setError(msg);
            toast.error(msg);
        } finally {
            setUploading(false);
            setIsDragging(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [clientId, intakeId, userId, onUploadComplete]); // Added dependencies

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    relative group cursor-pointer
                    border-2 border-dashed rounded-xl p-8
                    transition-all duration-200 ease-in-out
                    flex flex-col items-center justify-center text-center
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                    ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Uploading...</p>
                        <p className="text-xs text-slate-500">Encrypting & storing file</p>
                    </div>
                ) : (
                    <>
                        <div className={`
                            h-12 w-12 rounded-full mb-4 flex items-center justify-center transition-colors
                            ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}
                        `}>
                            <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                            <span className="text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            PDF, PNG, JPG up to 10MB
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
