import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Briefcase, GraduationCap, Target, Building2 } from 'lucide-react';
import { useEmployment } from '@/features/intake/hooks/useEmployment';
import { VocationalData } from '@/features/intake/intakeTypes';
import { GlassCard } from '@/components/ui/GlassCard';

// Panels
import { VocationalHistoryPanel } from './sections/employment/VocationalHistoryPanel';
import { GoalsPanel } from './sections/employment/GoalsPanel';
import { PrepPanel } from './sections/employment/PrepPanel';
import { PlacementPanel } from './sections/employment/PlacementPanel';

interface Props {
    intakeId: string;
}

type Tab = 'history' | 'goals' | 'prep' | 'placement';

export const ModernizedEmploymentSection: React.FC<Props> = ({ intakeId }) => {
    const { data, loading, saving, error, saveEmployment } = useEmployment(intakeId);

    // Note: useEmployment ensures ispGoals is an array, never null.
    // However, if the server returns null, we default to [] in map, so safe.
    // We maintain a local copy to drive the UI inputs immediately
    const [localData, setLocalData] = useState<VocationalData | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('history');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync remote data to local on initial load
    useEffect(() => {
        if (data && !localData) {
            setLocalData({
                ...data,
                ispGoals: data.ispGoals || [] // Ensure array
            });
        }
    }, [data, localData]);

    const handleDebouncedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!localData) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        let newValue: any = value;
        if (type === 'checkbox') newValue = checked;
        // handle custom types from multi-select if needed, usually value is correct
        if (e.target.type === 'custom') { // pseudo-type check if we used that hack
            newValue = value; // assume value is the array
        }

        // 1. Update Local UI immediately
        setLocalData(prev => prev ? ({ ...prev, [name]: newValue }) : null);

        // 2. Decide Save Strategy
        const isCheckbox = type === 'checkbox' || type === 'select-one' || type === 'custom'; // Custom is our multi-select

        if (isCheckbox) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            saveEmployment({ [name]: newValue } as any);
        } else {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                saveEmployment({ [name]: newValue } as any);
            }, 1000);
        }
    };

    if (loading || !localData) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    Employment & Vocational Services
                </h2>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-primary animate-pulse font-medium">Saving...</span>}
                    {error && <span className="text-xs text-red-500 font-medium">Error</span>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
                {[
                    { id: 'history', label: 'History & Skills', icon: GraduationCap },
                    { id: 'goals', label: 'ISP Goals', icon: Target },
                    { id: 'prep', label: 'Preparation', icon: Briefcase },
                    { id: 'placement', label: 'Plymouth Placement', icon: Building2 }, // SME Terminology
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900'}
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'history' && <VocationalHistoryPanel formData={localData} onChange={handleDebouncedChange} />}
                {activeTab === 'goals' && <GoalsPanel formData={localData} onChange={handleDebouncedChange} />}
                {activeTab === 'prep' && <PrepPanel formData={localData} onChange={handleDebouncedChange} />}
                {activeTab === 'placement' && <PlacementPanel formData={localData} onChange={handleDebouncedChange} />}
            </div>

            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={() => saveEmployment({ sectionStatus: 'in_progress' } as any)} // or use saveDraft from hook if destructured
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                    Save as Draft
                </button>
                <button
                    onClick={() => saveEmployment({ sectionStatus: 'complete' } as any)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:shadow-lg transition-all"
                >
                    Mark Complete
                </button>
            </div>
        </div >
    );
};
