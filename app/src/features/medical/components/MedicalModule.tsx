'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { useMedical } from '@/features/intake/hooks/useMedical';
import { MedicalData } from '@/features/intake/intakeTypes';
import { MedicalHistorySection } from '@/features/intake/components/sections/evaluation/MedicalHistorySection';
import { MentalHealthHistorySection } from '@/features/intake/components/sections/evaluation/MentalHealthHistorySection';
import { SubstanceUseSection } from '@/features/intake/components/sections/evaluation/SubstanceUseSection';
import { GlassCard } from '@/components/ui/GlassCard';

interface MedicalModuleProps {
    intakeId: string;
    onStatusChange?: (status: string) => void;
}

/**
 * MedicalModule
 * SME: Clinical & Medical Domain
 * Isolated from the monolithic form.
 */
export const MedicalModule: React.FC<MedicalModuleProps> = ({ intakeId, onStatusChange }) => {
    const { data, loading, saving, error, saveMedical } = useMedical(intakeId);
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
            saveMedical({ [name]: newValue } as any);
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
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Medical & Psychosocial</h2>
                        <p className="text-xs text-white/50">Clinical history and health assertions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-primary animate-pulse font-medium">Saving...</span>}
                    {error && <span className="text-xs text-red-500 font-medium whitespace-nowrap">Error saving</span>}
                </div>
            </div>

            <MedicalHistorySection formData={localData} onChange={handleDebouncedChange} />
            <MentalHealthHistorySection formData={localData} onChange={handleDebouncedChange} />
            <SubstanceUseSection formData={localData} onChange={handleDebouncedChange} />

            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={() => {
                        saveMedical({ sectionStatus: 'complete' } as any);
                        if (onStatusChange) onStatusChange('complete');
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                    Finalize Medical Domain
                </button>
            </div>
        </div>
    );
};
