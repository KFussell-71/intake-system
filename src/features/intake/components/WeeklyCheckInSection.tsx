import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const WeeklyCheckInSection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-4 pb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-white">
                <CalendarClock className="w-5 h-5 text-primary" />
                Weekly Progress Check-Ins
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                You will meet with the employment specialist every week to review progress and receive additional support.
            </p>

            <GlassCard className="p-6 border border-primary/20 bg-primary/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Recurring Meeting Day
                        </label>
                        <select
                            name="checkInDay"
                            value={formData.checkInDay}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 
                            border border-slate-200 dark:border-white/10 rounded-2xl
                            text-slate-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                            transition-all duration-200"
                        >
                            <option value="">Select a day...</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                        </select>
                    </div>

                    <ElegantInput
                        label="Meeting Time"
                        name="checkInTime"
                        value={formData.checkInTime}
                        onChange={onChange}
                        type="time"
                        icon={<Clock className="w-4 h-4" />}
                    />
                </div>

                <div className="mt-4">
                    <ElegantTextarea
                        label="Notes / Focus Areas"
                        name="checkInNotes"
                        value={formData.checkInNotes}
                        onChange={onChange}
                        placeholder="E.g., Focus on interview prep this week..."
                        className="min-h-[80px]"
                    />
                </div>
            </GlassCard>
        </div>
    );
};
