import React from 'react';
import { any } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eye, Smile } from 'lucide-react';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const AppearanceSection: React.FC<Props> = ({ formData, onChange }) => {

    // Helper for multi-select checkboxes
    const handleMultiSelect = (field: keyof any, value: string, checked: boolean) => {
        const current = (formData[field] as string[]) || [];
        const updated = checked
            ? [...current, value]
            : current.filter(item => item !== value);

        onChange({
            target: { name: field, value: updated }
        } as any);
    };

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Eye className="w-5 h-5 text-primary" />
                Appearance / Behavior & Mood
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Appearance Column */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-2">
                        General Appearance
                    </h4>

                    {/* Clothing */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clothing</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Clean', 'Appropriate', 'Disheveled', 'Torn'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.appearanceClothing || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('appearanceClothing', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Hygiene */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hygiene</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Seems Fine', 'Poor Hygiene'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.appearanceHygiene || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('appearanceHygiene', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Behavior */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Behavior</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['Cooperative', 'Uncooperative', 'Oriented to time/place', 'Disoriented/confused', 'Pressured speech', 'Psychomotor retardation', 'Seems affected by substance'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.generalBehavior || []).includes(opt)}
                                        onChange={(e) => handleMultiSelect('generalBehavior', opt, e.target.checked)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mood Column */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
                        <Smile className="w-4 h-4" /> Mood & Affect
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            'Normal, calm', 'Appropriate', 'Inappropriate',
                            'Angry/hostile', 'Fearful', 'Anxious',
                            'Depressed/sad', 'Irritable', 'Adaptable',
                            'Happy/elated', 'Relieved', 'Agitated', 'Withdrawn'
                        ].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(formData.clientMood || []).includes(opt)}
                                    onChange={(e) => handleMultiSelect('clientMood', opt, e.target.checked)}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Other Mood/Behavior Notes</label>
                        <input
                            type="text"
                            name="clientMoodOther"
                            value={formData.clientMoodOther}
                            onChange={onChange}
                            className="w-full text-sm rounded-md border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-primary"
                            placeholder="Describe..."
                        />
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
