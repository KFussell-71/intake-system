'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Eye, Type } from 'lucide-react';

export const AccessibilityToggle = () => {
    const { theme, setTheme } = useTheme();
    const [isDyslexic, setIsDyslexic] = React.useState(false);

    React.useEffect(() => {
        if (isDyslexic) {
            document.documentElement.classList.add('font-dyslexic');
        } else {
            document.documentElement.classList.remove('font-dyslexic');
        }
    }, [isDyslexic]);

    const toggleHighContrast = () => {
        if (theme === 'high-contrast') {
            setTheme('light');
        } else {
            setTheme('high-contrast');
        }
    };

    return (
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
            <button
                onClick={toggleHighContrast}
                className={`p-2 rounded-md transition-colors ${theme === 'high-contrast' ? 'bg-yellow-400 text-black font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="Toggle High Contrast"
            >
                <Eye className="w-5 h-5" />
            </button>
            <button
                onClick={() => setIsDyslexic(!isDyslexic)}
                className={`p-2 rounded-md transition-colors ${isDyslexic ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="Toggle Dyslexia Friendly Font"
            >
                <Type className="w-5 h-5" />
            </button>
        </div>
    );
};
