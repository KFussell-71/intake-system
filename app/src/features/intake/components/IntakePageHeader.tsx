'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Shield } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';

interface IntakePageHeaderProps {
    lastSaved: Date | null;
    isReadOnly: boolean;
    onToggleEdit: () => void;
    onShowPreview: () => void;
    onSaveAndExit: () => void;
}

export const IntakePageHeader: React.FC<IntakePageHeaderProps> = ({
    lastSaved,
    isReadOnly,
    onToggleEdit,
    onShowPreview,
    onSaveAndExit
}) => {
    const router = useRouter();

    return (
        <div className="flex justify-between items-start mb-8 max-w-3xl mx-auto lg:mx-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-semibold group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
                {lastSaved && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            Last Snapshot Taken {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={onShowPreview}
                    icon={<Eye className="w-4 h-4" />}
                    className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                    Preview Report
                </ActionButton>
                <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={onSaveAndExit}
                    className="border-slate-200"
                >
                    Save & Exit
                </ActionButton>
                <AccessibilityToggle />
                {!isReadOnly && (
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={onToggleEdit}
                        icon={<Shield className="w-4 h-4" />}
                        className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    >
                        Supervisor View
                    </ActionButton>
                )}
            </div>
        </div>
    );
};
