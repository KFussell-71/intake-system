'use client';

import React, { useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, RotateCcw } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface SignaturePadProps {
    onSignatureChange: (dataUrl: string) => void;
    initialValue?: string;
    label?: string;
    required?: boolean;
    className?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
    onSignatureChange,
    initialValue,
    label = 'Signature',
    required = false,
    className = '',
}) => {
    const sigCanvasRef = useRef<SignatureCanvas | null>(null);
    const [isEmpty, setIsEmpty] = React.useState(!initialValue);

    const handleEnd = useCallback(() => {
        if (sigCanvasRef.current) {
            const dataUrl = sigCanvasRef.current.toDataURL('image/png');
            onSignatureChange(dataUrl);
            setIsEmpty(false);
        }
    }, [onSignatureChange]);

    const handleClear = useCallback(() => {
        if (sigCanvasRef.current) {
            sigCanvasRef.current.clear();
            onSignatureChange('');
            setIsEmpty(true);
        }
    }, [onSignatureChange]);

    const handleUndo = useCallback(() => {
        if (sigCanvasRef.current) {
            const data = sigCanvasRef.current.toData();
            if (data && data.length > 0) {
                data.pop();
                sigCanvasRef.current.fromData(data);
                if (data.length === 0) {
                    onSignatureChange('');
                    setIsEmpty(true);
                } else {
                    const dataUrl = sigCanvasRef.current.toDataURL('image/png');
                    onSignatureChange(dataUrl);
                }
            }
        }
    }, [onSignatureChange]);

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-2 bg-white dark:bg-slate-900">
                <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-32 rounded-lg cursor-crosshair',
                        style: {
                            width: '100%',
                            height: '128px',
                            touchAction: 'none'
                        }
                    }}
                    onEnd={handleEnd}
                />
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 italic">
                    {isEmpty ? 'Sign above using mouse or touch' : 'Signature captured'}
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Undo last stroke"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Clear signature"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isEmpty && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Signature recorded</span>
                </div>
            )}
        </div>
    );
};
