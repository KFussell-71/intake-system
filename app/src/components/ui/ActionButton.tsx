'use client';

import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const ActionButton = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className = '',
    disabled,
    fullWidth = false,
    ...props
}: ActionButtonProps) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer gap-2';

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm rounded-xl',
        md: 'px-5 py-2.5 text-base rounded-2xl',
        lg: 'px-8 py-4 text-lg rounded-3xl',
    };

    const variantClasses = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30',
        secondary: 'bg-white/10 text-primary dark:text-white border border-primary/10 dark:border-white/10 hover:bg-primary/5 dark:hover:bg-white/5',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
        ghost: 'bg-transparent text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/5',
    };

    return (
        <button
            className={`
                ${baseClasses} 
                ${sizeClasses[size]} 
                ${variantClasses[variant]} 
                ${fullWidth ? 'w-full' : ''} 
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && icon}
            {children}
        </button>
    );
};
