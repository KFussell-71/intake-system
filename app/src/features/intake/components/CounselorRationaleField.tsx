import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
}

export const CounselorRationaleField: React.FC<Props> = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    className
}) => {
    return (
        <div className={cn(
            "p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3",
            className
        )}>
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                {label} (Clinical Rationale)
            </div>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder || "Document your clinical judgment and evidence here..."}
                className="w-full min-h-[100px] p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 font-medium">
                * This section is for professional determination and audit defense. Keep distinct from client self-reports.
            </p>
        </div>
    );
};
