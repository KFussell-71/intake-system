'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, FileText, User, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GlobalSearchService, GlobalSearchResult } from '@/lib/services/GlobalSearchService';
// import { Dialog, DialogContent } from '@radix-ui/react-dialog'; // Use local UI component if available

export function GlobalSearchDialog() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        const openSearch = () => setOpen(true);

        document.addEventListener('keydown', down);
        window.addEventListener('open-global-search', openSearch);
        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-global-search', openSearch);
        };
    }, []);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await GlobalSearchService.searchAll(query);
                setResults(data);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                    <Search className="mr-2 h-5 w-5 opacity-50 text-slate-500" />
                    <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100"
                        placeholder="Search clients, documents, or actions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 dark:bg-slate-800 dark:text-slate-400 sm:flex">
                        <span className="text-xs">ESC</span>
                    </kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && query.length > 1 && !loading && (
                        <div className="py-14 text-center text-sm sm:px-14">
                            <Search className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">No results found for &quot;{query}&quot;</p>
                        </div>
                    )}

                    {results.map((result) => (
                        <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result.url)}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                                {result.type === 'client' ? <User className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="truncate font-medium text-slate-900 dark:text-slate-100">{result.title}</div>
                                <div className="truncate text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                    ))}

                    {results.length > 0 && (
                        <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-2 px-2 pb-1">
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-right">
                                Search provided by Intake Global Index
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
