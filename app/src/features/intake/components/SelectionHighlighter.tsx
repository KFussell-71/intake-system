import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Flag, Plus } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

interface Props {
    children: React.ReactNode;
    onPromote: (text: string) => void;
}

/**
 * UI: Selection Highlighter
 * 
 * Detects text selection within narrative fields and shows a floating 
 * action menu to promote the text to a clinical barrier.
 */
export const SelectionHighlighter: React.FC<Props> = ({ children, onPromote }) => {
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !containerRef.current) {
            setMenuPos(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const text = selection.toString().trim();

        // Ensure selection is within our container
        if (containerRef.current.contains(range.commonAncestorContainer) && text.length > 3) {
            const rect = range.getBoundingClientRect();
            setMenuPos({
                x: rect.left + rect.width / 2 + window.scrollX,
                y: rect.top + window.scrollY - 40
            });
            setSelectedText(text);
        } else {
            setMenuPos(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, [handleSelection]);

    return (
        <div ref={containerRef} className="relative group/highlighter">
            {children}

            {menuPos && (
                <div
                    className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: `${menuPos.x}px`,
                        top: `${menuPos.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-indigo-500/10">
                        <button
                            onClick={() => {
                                onPromote(selectedText);
                                setMenuPos(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded transition-colors"
                        >
                            <Flag className="w-3 h-3" />
                            Promote to Barrier
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
