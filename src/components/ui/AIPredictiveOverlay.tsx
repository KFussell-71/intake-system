import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    suggestion: string | null;
    isLoading: boolean;
    onAccept: (text: string) => void;
    onDismiss: () => void;
}

export const AIPredictiveOverlay: React.FC<Props> = ({ suggestion, isLoading, onAccept, onDismiss }) => {
    if (!suggestion && !isLoading) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-start gap-3 shadow-sm group"
            >
                <div className="bg-white dark:bg-indigo-500/20 p-1.5 rounded-lg shadow-sm">
                    <Sparkles className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isLoading ? 'animate-pulse' : ''}`} />
                </div>

                <div className="flex-1">
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        AI Suggestion
                        {isLoading && <span className="inline-block w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />}
                        {isLoading && <span className="inline-block w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />}
                        {isLoading && <span className="inline-block w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />}
                    </div>

                    {isLoading ? (
                        <div className="h-4 w-3/4 bg-indigo-200/50 dark:bg-indigo-500/20 animate-pulse rounded" />
                    ) : (
                        <p className="text-xs text-indigo-900 dark:text-indigo-100 leading-relaxed italic">
                            "{suggestion}"
                        </p>
                    )}
                </div>

                {!isLoading && (
                    <div className="flex items-center gap-1 self-center">
                        <button
                            onClick={() => onAccept(suggestion!)}
                            className="p-1.5 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 rounded-md transition-colors"
                            title="Accept and append"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onDismiss}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 rounded-md transition-colors"
                            title="Dismiss"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
