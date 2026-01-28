'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
}

export const GlassCard = ({ children, className = '', hoverable = false, ...props }: GlassCardProps) => {
    const baseClasses = 'bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl transition-all duration-300 rounded-3xl p-6';
    const hoverClasses = hoverable ? 'hover:bg-white/80 dark:hover:bg-slate-900/50 hover:border-white/30 dark:hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : '';

    return (
        <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
            {children}
        </div>
    );
};
