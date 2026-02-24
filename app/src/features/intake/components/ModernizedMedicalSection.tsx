import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMedical } from '../hooks/useMedical';
import type { MedicalData } from '../intakeTypes';
import { MedicalHistorySection } from './sections/evaluation/MedicalHistorySection';
import { MentalHealthHistorySection } from './sections/evaluation/MentalHealthHistorySection';
import { SubstanceUseSection } from './sections/evaluation/SubstanceUseSection';

interface Props {
    intakeId: string;
}

export const ModernizedMedicalSection: React.FC<Props> = ({ intakeId }) => {
    const { data, loading, saving, error, saveMedical } = useMedical(intakeId);

    // We maintain a local copy to drive the UI inputs immediately
    // while we debounce the server save.
    const [localData, setLocalData] = useState<MedicalData | null>(null);

    // Sync remote data to local on initial load
    useEffect(() => {
        if (data && !localData) {
            setLocalData(data);
        }
    }, [data, localData]);



    // Ref-based debounce
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDebouncedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!localData) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const newValue = type === 'checkbox' ? checked : value;

        setLocalData((prev: MedicalData | null) => prev ? ({ ...prev, [name]: newValue }) : null);

        if (type === 'checkbox' || type === 'select-one') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            saveMedical({ [name]: newValue } as any);
        } else {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                saveMedical({ [name]: newValue } as any);
            }, 1000);
        }
    };

    if (loading || !localData) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    // Cast partial types to match strict sub-component props if needed
    // Assuming sub-components take any superset
    const formData = localData as any;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Medical & Psychosocial History
                </h2>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-primary animate-pulse font-medium">Saving...</span>}
                    {error && <span className="text-xs text-red-500 font-medium">Error</span>}
                </div>
            </div>

            <MedicalHistorySection formData={formData} onChange={handleDebouncedChange} />
            <MentalHealthHistorySection formData={formData} onChange={handleDebouncedChange} />
            <SubstanceUseSection formData={formData} onChange={handleDebouncedChange} />
            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={() => saveMedical({ sectionStatus: 'in_progress' } as any)} // or use saveDraft from hook if destructured
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                    Save as Draft
                </button>
                <button
                    onClick={() => saveMedical({ sectionStatus: 'complete' } as any)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md hover:shadow-lg transition-all"
                >
                    Mark Complete
                </button>
            </div>
        </div>
    );
};
