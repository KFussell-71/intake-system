import React from 'react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { any } from '../../types/intake';
import { Users, Calendar, Briefcase, Heart } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Props {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const DemographicsSection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Users className="w-5 h-5 text-primary" />
                Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ElegantInput
                    label="Referred By"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={onChange}
                    placeholder="Agency, Friend, etc."
                />
                <ElegantInput
                    label="Birthdate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={onChange}
                    type="date"
                    icon={<Calendar className="w-4 h-4" />}
                />
            </div>

            <div className="space-y-6">
                {/* Gender */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Gender</label>
                    <div className="flex flex-wrap gap-4">
                        {['Female', 'Male', 'Non-Binary', 'Prefer Not to Answer'].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-primary transition-all">
                                <input
                                    type="radio"
                                    name="gender"
                                    value={option}
                                    checked={formData.gender === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Race/Ethnicity */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Race/Ethnicity</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            'American Indian or Alaska Native',
                            'Asian',
                            'Black or African American',
                            'Hispanic or Latino',
                            'Native Hawaiian or Other Pacific Islander',
                            'White',
                            'Two or More Races',
                            'Prefer Not to Answer'
                        ].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-primary transition-all">
                                <input
                                    type="radio"
                                    name="race"
                                    value={option}
                                    checked={formData.race === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Employment Status */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Employment Status
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            'Employed - Full-time',
                            'Employed - Part-time',
                            'Self-employed',
                            'Out of work',
                            'Stay-at-home parent',
                            'Student',
                            'Retired',
                            'Unable to work'
                        ].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-primary transition-all">
                                <input
                                    type="radio"
                                    name="employmentStatus"
                                    value={option}
                                    checked={formData.employmentStatus === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Relationship Status */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Relationship Status
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            'Single',
                            'Single living with partner',
                            'Married',
                            'Divorced',
                            'Separated',
                            'Widowed'
                        ].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-primary transition-all">
                                <input
                                    type="radio"
                                    name="relationshipStatus"
                                    value={option}
                                    checked={formData.relationshipStatus === option}
                                    onChange={onChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
