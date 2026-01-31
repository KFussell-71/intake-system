'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { uploadPortalDocument } from '@/app/actions/portal/uploadPortalDocument';

/**
 * PORTAL DOCUMENTS PAGE
 * 
 * WCAG 2.1 AA Compliant document upload interface.
 * Allows portal clients to securely upload documents.
 */

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function PortalDocuments() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const alertRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setMessage(null);

        if (!selectedFile) {
            setFile(null);
            return;
        }

        // Validate file type
        if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
            setMessage({
                type: 'error',
                text: 'Invalid file type. Please upload a PDF, JPG, PNG, GIF, or WebP file.'
            });
            setFile(null);
            return;
        }

        // Validate file size
        if (selectedFile.size > MAX_SIZE_BYTES) {
            setMessage({
                type: 'error',
                text: `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
            });
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data URL prefix
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const result = await uploadPortalDocument(file.name, base64, file.type);

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Document uploaded successfully!' });
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setMessage({ type: 'error', text: result.error || 'Upload failed. Please try again.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setUploading(false);
            // Focus alert for screen readers
            alertRef.current?.focus();
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <nav className="text-sm text-slate-400 mb-2" aria-label="Breadcrumb">
                    <Link href="/portal" className="hover:text-white transition-colors">Dashboard</Link>
                    <span className="mx-2">/</span>
                    <span className="text-white">Documents</span>
                </nav>
                <h1 className="text-2xl font-bold text-white">Upload Documents</h1>
                <p className="text-slate-400 mt-1">
                    Upload only documents requested by your Employment Specialist.
                </p>
            </div>

            {/* Alert Message */}
            {message && (
                <div
                    ref={alertRef}
                    role="alert"
                    tabIndex={-1}
                    className={`p-4 rounded-xl ${message.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <p className={message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}>
                            {message.text}
                        </p>
                    </div>
                </div>
            )}

            {/* Upload Form */}
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <div className="space-y-6">
                    {/* File Input */}
                    <div>
                        <label
                            htmlFor="doc-upload"
                            className="block text-sm font-medium text-white mb-2"
                        >
                            Select document to upload
                        </label>

                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                id="doc-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                onChange={handleFileChange}
                                aria-describedby="upload-help"
                                className="block w-full text-sm text-slate-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-medium
                                    file:bg-emerald-500/20 file:text-emerald-300
                                    hover:file:bg-emerald-500/30
                                    file:cursor-pointer file:transition-colors
                                    cursor-pointer"
                            />
                        </div>

                        <p id="upload-help" className="mt-2 text-sm text-slate-500">
                            Accepted formats: PDF, JPG, PNG, GIF, WebP. Maximum size: {MAX_SIZE_MB}MB.
                        </p>
                    </div>

                    {/* Selected File Preview */}
                    {file && (
                        <div className="bg-slate-900/50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{file.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="p-1 text-slate-400 hover:text-white transition-colors"
                                    aria-label="Remove selected file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            'Upload Document'
                        )}
                    </button>
                </div>
            </div>

            {/* Security Note */}
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm text-slate-400">
                        Your documents are encrypted and stored securely. Only your Employment Specialist and authorized staff can access them.
                    </p>
                </div>
            </div>
        </div>
    );
}
