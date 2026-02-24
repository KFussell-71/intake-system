'use client';

import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
    onSignatureChange: (base64: string | null) => void;
    disabled?: boolean;
    defaultValue?: string;
    label?: string;
    required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange, disabled = false, defaultValue, label, required }) => {

    const sigCanvas = useRef<SignatureCanvas>(null);

    useEffect(() => {
        if (defaultValue && sigCanvas.current) {
            sigCanvas.current.fromDataURL(defaultValue);
        }
    }, [defaultValue]);

    const clear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            onSignatureChange(null);
        }
    };

    const handleEnd = () => {
        if (sigCanvas.current) {
            if (sigCanvas.current.isEmpty()) {
                onSignatureChange(null);
            } else {
                // Returns base64 image string
                const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
                onSignatureChange(dataUrl);
            }
        }
    };


    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden relative bg-white dark:bg-slate-900">

                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-40 cursor-crosshair disabled:cursor-not-allowed',
                        style: { width: '100%', height: 160, touchAction: 'none' }
                    }}
                    onEnd={handleEnd}
                    backgroundColor="transparent"
                />
                {disabled && <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 z-10 cursor-not-allowed" />}
            </div>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    disabled={disabled}
                    className="flex items-center gap-2 text-xs"
                >
                    <Eraser className="w-3 h-3" />
                    Clear Signature
                </Button>
            </div>
        </div>
    );
};
