'use client';

import React from 'react';

interface ElegantInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const ElegantInput = ({ label, error, icon, className = '', id, ...props }: ElegantInputProps) => {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    className={`
                        w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 
                        border border-slate-200 dark:border-white/10 rounded-2xl
                        text-slate-900 dark:text-white placeholder-slate-400 
                        focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                        transition-all duration-200
                        ${icon ? 'pl-11' : ''}
                        ${error ? 'border-red-500 focus:ring-red-500/30' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
};

interface ElegantTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

export const ElegantTextarea = ({ label, error, className = '', id, ...props }: ElegantTextareaProps) => {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={id}
                className={`
                    w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 
                    border border-slate-200 dark:border-white/10 rounded-2xl
                    text-slate-900 dark:text-white placeholder-slate-400 
                    focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                    transition-all duration-200 resize-none
                    ${error ? 'border-red-500 focus:ring-red-500/30' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
};
