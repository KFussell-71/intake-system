
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { ActionButton } from '@/components/ui/ActionButton';
import { Loader2, PenTool } from 'lucide-react';
import { signDocument } from '@/app/actions/documents/signDocument';

interface FormSignerModalProps {
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FORMS = [
    { id: 'HIPAA_AuthorizationForm.pdf', label: 'HIPAA Authorization' },
    { id: 'Notice-Of-Privacy-Practices-and-Office-Policy.pdf', label: 'Notice of Privacy Practices' }
];

export function FormSignerModal({ clientId, isOpen, onClose, onSuccess }: FormSignerModalProps) {
    const [selectedForm, setSelectedForm] = useState(FORMS[0].id);
    const [signatureData, setSignatureData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSign = async () => {
        if (!signatureData) return;
        setIsSubmitting(true);
        setError('');

        try {
            const result = await signDocument(
                clientId,
                selectedForm as any,
                signatureData
            );

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Signing failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Sign Standard Form</DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Form Selection */}
                    <div className="flex gap-2 p-2 bg-slate-50 rounded-lg">
                        {FORMS.map(form => (
                            <button
                                key={form.id}
                                onClick={() => setSelectedForm(form.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedForm === form.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {form.label}
                            </button>
                        ))}
                    </div>

                    {/* Preview - Embedding the blank PDF so user knows what they are signing */}
                    <div className="flex-1 border rounded-lg overflow-hidden bg-slate-100 relative">
                        <iframe
                            src={`/forms/${selectedForm}#toolbar=0`}
                            className="w-full h-full"
                            title="Form Preview"
                        />

                        {/* Signature Overlay Visual Cue */}
                        <div className="absolute bottom-20 left-20 bg-yellow-100/80 border-2 border-yellow-400 border-dashed p-4 text-xs text-yellow-700 pointer-events-none rounded">
                            Signature will appear roughly here
                        </div>
                    </div>

                    {/* Signature Input */}
                    <div className="border-t pt-4 space-y-4">
                        <div className="font-semibold text-sm text-slate-700">Draw Authorization Signature (Trackpad/Mouse)</div>
                        <SignaturePad onSignatureChange={setSignatureData} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <ActionButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </ActionButton>
                        <ActionButton
                            onClick={handleSign}
                            isLoading={isSubmitting}
                            disabled={!signatureData}
                            icon={<PenTool className="w-4 h-4" />}
                        >
                            Sign & Save Document
                        </ActionButton>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
