'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { uploadPortalDocument } from '@/app/actions/portal/uploadPortalDocument';

interface Props {
    request: {
        id: string;
        name: string;
        description: string;
        status: string;
        requested_at: string;
    };
    onUploadComplete: () => void;
}

export const DocumentRequestCard: React.FC<Props> = ({ request, onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // Convert to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const result = await uploadPortalDocument(file.name, base64, file.type, request.id);

            if (result.success) {
                onUploadComplete();
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            setError('An error occurred during upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (request.status === 'uploaded') {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{request.name}</h3>
                        <p className="text-xs text-emerald-400">Uploaded successfully</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 transition-all hover:border-blue-500/30">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{request.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{request.description}</p>
                        {error && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {error}
                            </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2">
                            Requested {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-xs font-medium text-white transition-colors"
                    >
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-3 h-3" />
                                Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
