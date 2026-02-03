'use client';

import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DocumentPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: {
        title: string;
        url: string;
        mimeType: string;
    } | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewDialogProps) {
    if (!document) return null;

    const isPdf = document.mimeType === 'application/pdf';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-950/95 backdrop-blur-xl border-slate-800 text-slate-100">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <DialogTitle className="text-sm font-medium truncate text-slate-100">
                            {document.title}
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => window.open(document.url, '_blank')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-slate-900/50 relative overflow-hidden flex items-center justify-center">
                    {/* Preview Content */}
                    {isPdf ? (
                        <iframe
                            src={`${document.url}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-0"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                            <img
                                src={document.url}
                                alt={document.title}
                                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
