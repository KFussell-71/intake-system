import React from 'react';
import { Eye, Edit3, Lock } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

interface Props {
    isReadOnly: boolean;
    onToggleEdit: () => void;
    viewerName?: string;
}

export const ReviewModeBanner: React.FC<Props> = ({ isReadOnly, onToggleEdit, viewerName }) => {
    if (!isReadOnly) return null;

    return (
        <div className="fixed top-20 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <div className="bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 backdrop-blur-md rounded-full px-4 py-2 shadow-lg flex items-center gap-4 pointer-events-auto animate-in slide-in-from-top-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">
                    <Eye className="w-4 h-4" />
                    <span>Viewing Mode</span>
                </div>
                <div className="h-4 w-px bg-amber-300 dark:bg-amber-700" />
                <button
                    onClick={onToggleEdit}
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-1 transition-colors"
                >
                    <Edit3 className="w-3 h-3" />
                    Enable Editing
                </button>
            </div>
        </div>
    );
};
