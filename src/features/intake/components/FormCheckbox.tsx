import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface FormCheckboxProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ label, name, checked, onChange, error }) => {
    return (
        <div className="space-y-1">
            <label className={`
                flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border
                ${checked
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300'}
                ${error ? 'border-red-500 ring-1 ring-red-500/20' : ''}
            `}>
                <div className={`
                    w-5 h-5 rounded-lg flex items-center justify-center border transition-all
                    ${checked ? 'bg-accent border-accent text-white' : 'border-slate-300 dark:border-white/20'}
                `}>
                    {checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="w-3 h-3" /></motion.div>}
                </div>
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    className="hidden"
                />
                <span className="text-sm font-bold tracking-tight">{label}</span>
            </label>
            {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
        </div>
    );
};
