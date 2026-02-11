import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useMedical } from '../hooks/useMedical';
import { MedicalData } from '../../types/intake';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!localData) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const newValue = type === 'checkbox' ? checked : value;

        // 1. Update Local UI immediately
        setLocalData(prev => prev ? ({ ...prev, [name]: newValue }) : null);

        // 2. Decide Save Strategy
        // Checkboxes/Selects -> Immediate Save
        // Text Inputs -> Debounce handled by useMedical? No, useMedical sends immediately.
        // We really should debounce here.

        // Since useMedical doesn't debounce, let's just trigger save.
        // For text inputs, this might be spammy but acceptable for MVP
        // or we can add a simple timeout logic here if performance suffers.
        // Given 'ModernizedIntakeStepIdentity' does similar logic (save on blur/change), 
        // let's stick to immediate save for now but rely on React's event batching.

        // Actually, for text fields, we should probably debounce.
        // But implementing full debounce inside this component without a library is verbose.
        // Let's rely on the user pausing typing or blur?
        // Let's implement a simple timeout.

        // Wait, saving on every keystroke is bad.
        // Let's modify saveMedical call.

        if (type === 'checkbox' || type === 'select-one') {
            saveMedical({ [name]: newValue } as any);
        } else {
            // For text, we update local state, but don't save immediately.
            // Ideally we save on blur. But sub-components don't expose onBlur easily.
            // So we use a timeout.
            const timeoutId = setTimeout(() => {
                saveMedical({ [name]: newValue } as any);
            }, 1000);

            // This closes over the specific value for this specific call.
            // Race condition: if user types 'a', 'b', 'c' fast:
            // 3 timeouts created. All fire.
            // We need to clear previous timeout. 
            // We can't clear inside this function easily without a ref.
        }
    };

    // Ref-based debounce
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDebouncedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!localData) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const newValue = type === 'checkbox' ? checked : value;

        setLocalData(prev => prev ? ({ ...prev, [name]: newValue }) : null);

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
    // Assuming sub-components take IntakeFormData superset
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
