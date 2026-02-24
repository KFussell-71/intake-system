import React from 'react';
import { diffLines, Change } from 'diff';

interface RedlineViewerProps {
    before: string;
    after: string;
}

export const RedlineViewer: React.FC<RedlineViewerProps> = ({ before, after }) => {
    const diff = diffLines(before, after);

    return (
        <div className="space-y-1 font-mono text-sm bg-slate-950 p-6 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto selection:bg-primary/30">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">Differential Audit Logs</span>
            </div>
            {diff.map((part, i) => {
                if (part.added) {
                    return (
                        <div key={i} className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md border-l-4 border-emerald-500 my-0.5">
                            <span className="opacity-40 mr-2">+</span>
                            {part.value}
                        </div>
                    );
                }
                if (part.removed) {
                    return (
                        <div key={i} className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-md border-l-4 border-rose-500 line-through my-0.5">
                            <span className="opacity-40 mr-2">-</span>
                            {part.value}
                        </div>
                    );
                }
                return (
                    <div key={i} className="px-3 py-1 text-slate-400 opacity-80">
                        <span className="opacity-20 mr-2"> </span>
                        {part.value}
                    </div>
                );
            })}
        </div>
    );
};
