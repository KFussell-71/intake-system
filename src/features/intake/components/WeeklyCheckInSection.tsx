import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { any } from '../types/intake';

interface Props {
    formData: any;
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

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">
                        Weekly Job Search Commitment (30 Days)
                    </h4>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded border border-slate-300 dark:border-white/20 flex items-center justify-center">
                                <span className="text-[10px] text-slate-400">☐</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span>Apply to</span>
                                <input
                                    type="text"
                                    name="jobSearchCommitmentCount"
                                    value={formData.jobSearchCommitmentCount || ''}
                                    onChange={onChange}
                                    placeholder="_____"
                                    className="w-16 px-2 py-1 bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none text-center font-bold"
                                />
                                <span>jobs per week</span>
                            </div>
                        </div>

                        {[
                            'Attend job readiness workshops',
                            'Meet with job developer weekly',
                            'Follow up on referrals',
                            'Participate in training / orientation'
                        ].map((commitment) => (
                            <div key={commitment} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id={`commitment-${commitment}`}
                                    checked={(formData.jobSearchCommitments || []).includes(commitment)}
                                    onChange={(e) => {
                                        const current = formData.jobSearchCommitments || [];
                                        const updated = e.target.checked
                                            ? [...current, commitment]
                                            : current.filter(c => c !== commitment);
                                        const event = {
                                            target: {
                                                name: 'jobSearchCommitments',
                                                value: updated
                                            }
                                        } as any;
                                        onChange(event);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor={`commitment-${commitment}`} className="text-sm text-slate-700 dark:text-slate-300">
                                    {commitment}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
