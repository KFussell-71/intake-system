'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Briefcase } from 'lucide-react';
import { useVocational } from '../../intake/hooks/useVocational';
import { VocationalData } from '@/features/intake/intakeTypes';
import { VocationalHistoryPanel } from '@/features/intake/components/sections/employment/VocationalHistoryPanel';
import { GoalsPanel } from '@/features/intake/components/sections/employment/GoalsPanel';
import { PrepPanel } from '@/features/intake/components/sections/employment/PrepPanel';
import { PlacementPanel } from '@/features/intake/components/sections/employment/PlacementPanel';

interface EmploymentModuleProps {
    intakeId: string;
    onStatusChange?: (status: string) => void;
}

/**
 * EmploymentModule
 * SME: Vocational & Economic Domain
 * Isolated from the monolithic form.
 */
export const EmploymentModule: React.FC<EmploymentModuleProps> = ({ intakeId, onStatusChange }) => {
    const { data, loading, saving, error, saveVocational } = useVocational(intakeId);
    const [localData, setLocalData] = useState<any>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (data && !localData) {
            setLocalData(data);
        }
    }, [data, localData]);

    const handleDebouncedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!localData) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const newValue = type === 'checkbox' ? checked : value;

        setLocalData((prev: any) => prev ? ({ ...prev, [name]: newValue }) : null);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        const delay = (type === 'checkbox' || type === 'select-one') ? 0 : 1000;

        debounceRef.current = setTimeout(() => {
            saveVocational({ [name]: newValue } as any);
            if (onStatusChange) onStatusChange('saving');
        }, delay);
    };

    if (loading || !localData) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Employment & Vocational</h2>
                        <p className="text-xs text-white/50">Wages, history, and readiness</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-primary animate-pulse font-medium">Saving...</span>}
                    {error && <span className="text-xs text-red-500 font-medium whitespace-nowrap">Error</span>}
                </div>
            </div>

            <VocationalHistoryPanel formData={localData} onChange={handleDebouncedChange} />
            <GoalsPanel formData={localData} onChange={handleDebouncedChange} />
            <PrepPanel formData={localData} onChange={handleDebouncedChange} />
            <PlacementPanel formData={localData} onChange={handleDebouncedChange} />

            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={() => {
                        saveVocational({ sectionStatus: 'complete' } as any);
                        if (onStatusChange) onStatusChange('complete');
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all"
                >
                    Finalize Vocational Domain
                </button>
            </div>
        </div>
    );
};
