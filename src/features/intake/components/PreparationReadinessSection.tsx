import React from 'react';
import { Calendar, CheckCircle2, ListTodo } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PreparationReadinessSection: React.FC<Props> = ({ formData, onChange }) => {

    const renderItem = (
        title: string,
        subtitle: string,
        dateField: keyof IntakeFormData,
        notesField: keyof IntakeFormData,
    ) => {
        const isComplete = !!formData[dateField];

        return (
            <GlassCard className={`p-4 border border-white/20 transition-all ${isComplete ? 'bg-indigo-500/5 border-indigo-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <ListTodo className="w-4 h-4" />}
                        </div>
                        <div>
                            <span className="block font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                            <span className="text-xs text-slate-500">{subtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <ElegantInput
                        label="Target Date"
                        name={dateField}
                        value={formData[dateField] as string}
                        onChange={onChange}
                        type="date"
                        icon={<Calendar className="w-4 h-4" />}
                        className="text-sm"
                    />

                    <ElegantTextarea
                        label="Notes & Details"
                        name={notesField}
                        value={formData[notesField] as string}
                        onChange={onChange}
                        placeholder="Add specific goals or feedback..."
                        className="text-sm min-h-[80px]"
                        enableDictation
                    />
                </div>
            </GlassCard>
        );
    };

    return (
        <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-white">
                <ListTodo className="w-5 h-5 text-primary" />
                Preparation & Readiness Tracking
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Track progress on key readiness milestones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderItem('Resume Update', 'Resume will be updated by:', 'resumeUpdateDate', 'resumeUpdateNotes')}
                {renderItem('Mock Interview', 'Interview scheduled on:', 'mockInterviewDate', 'mockInterviewNotes')}
                {renderItem('Networking', 'Activity on:', 'networkingDate', 'networkingNotes')}
            </div>

            <GlassCard className="p-6 mt-6 border border-white/20">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Industry Preference & Targets</h4>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Industry Preference
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                'Construction / Trades', 'Warehouse / Logistics', 'Customer Service',
                                'Food Service', 'Healthcare Support', 'Office / Clerical',
                                'IT / Technical', 'Open to any'
                            ].map((industry) => (
                                <div key={industry} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`industry-${industry}`}
                                        checked={(formData.industryPreferences || []).includes(industry)}
                                        onChange={(e) => {
                                            const current = formData.industryPreferences || [];
                                            const updated = e.target.checked
                                                ? [...current, industry]
                                                : current.filter(i => i !== industry);
                                            const event = {
                                                target: {
                                                    name: 'industryPreferences',
                                                    value: updated
                                                }
                                            } as any;
                                            onChange(event);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`industry-${industry}`} className="text-sm text-slate-700 dark:text-slate-300">{industry}</label>
                                </div>
                            ))}
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                                <ElegantInput
                                    name="industryOther"
                                    label="Other Industry"
                                    value={formData.industryOther}
                                    onChange={onChange}
                                    placeholder="Specify other industry..."
                                    className="bg-white/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ElegantInput
                            name="targetPay"
                            label="Target Pay Range"
                            value={formData.targetPay}
                            onChange={onChange}
                            placeholder="e.g. $18 - $22 / hr"
                            className="bg-white/50"
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Employment Type
                            </label>
                            <div className="flex gap-4 mt-2">
                                {['Full-Time', 'Part-Time', 'Temporary'].map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`type-${type}`}
                                            checked={(formData.employmentType || []).includes(type)}
                                            onChange={(e) => {
                                                const current = formData.employmentType || [];
                                                const updated = e.target.checked
                                                    ? [...current, type]
                                                    : current.filter(t => t !== type);
                                                const event = {
                                                    target: {
                                                        name: 'employmentType',
                                                        value: updated
                                                    }
                                                } as any;
                                                onChange(event);
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`type-${type}`} className="text-sm text-slate-700 dark:text-slate-300">{type}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tight">
                            Transferable Skills (check all that apply)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                'Customer Service', 'Manual Labor', 'Computer / Tech',
                                'Leadership / Supervision', 'Time Management', 'Communication',
                                'Problem Solving', 'Safety Awareness'
                            ].map((skill) => (
                                <div key={skill} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`skill-${skill}`}
                                        checked={(formData.transferableSkills || []).includes(skill)}
                                        onChange={(e) => {
                                            const current = formData.transferableSkills || [];
                                            const updated = e.target.checked
                                                ? [...current, skill]
                                                : current.filter(s => s !== skill);
                                            const event = {
                                                target: {
                                                    name: 'transferableSkills',
                                                    value: updated
                                                }
                                            } as any;
                                            onChange(event);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`skill-${skill}`} className="text-sm text-slate-700 dark:text-slate-300">{skill}</label>
                                </div>
                            ))}
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                                <ElegantInput
                                    name="transferableSkillsOther"
                                    label="Other Skills"
                                    value={formData.transferableSkillsOther}
                                    onChange={onChange}
                                    placeholder="Specify other skills..."
                                    className="bg-white/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6 border border-white/20">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wider text-sm">Skills & Experience Snapshot</h4>
                <ElegantTextarea
                    name="workExperienceSummary"
                    label="Previous Work Experience (brief)"
                    value={formData.workExperienceSummary}
                    onChange={onChange}
                    placeholder="Summarize key roles and work history..."
                    className="bg-white/50 min-h-[100px]"
                    enableDictation
                />
            </GlassCard>

            <GlassCard className="p-6 mt-6 border border-white/20">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Barriers to Employment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        'Transportation', 'Housing Instability', 'Criminal Background',
                        'Limited Work History', 'Gaps in Employment', 'Lack of Certifications',
                        'Childcare', 'Health/Mental Health', 'Substance Recovery',
                        'Identification/Documents', 'None Identified'
                    ].map((barrier) => (
                        <div key={barrier} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`barrier-${barrier}`}
                                // This is a simplified direct mutation for the demo. In prod, use a proper CheckboxGroup handler.
                                // onChange logic would need to be added to the parent's onChange payload handler to tolerate arrays.
                                // For now, we assume the parent handles basic input. We'll use a hacky connection to standard inputs if needed, 
                                // but ideally we update the onChange prop signature.
                                // Since Props.onChange is basic Event, we will implement a custom handler inside this component if we could, 
                                // but we are stateless.
                                // Let's try to simulate standard event for array support or assume the parent is capable.
                                // Actually, standard HTML input checkbox works with standard onChange if client logic parses it.
                                // But generic onChange usually expects value string.
                                // Let's render as standard inputs and handle array logic in a wrapper or just use JSON.stringify for quick storage if backend expects json.
                                // Wait, simple solution: Use standard inputs.
                                checked={(formData.barriers || []).includes(barrier)}
                                onChange={(e) => {
                                    const current = formData.barriers || [];
                                    const updated = e.target.checked
                                        ? [...current, barrier]
                                        : current.filter(b => b !== barrier);

                                    // Construct synthetic event
                                    const event = {
                                        target: {
                                            name: 'barriers',
                                            value: updated
                                        }
                                    } as any;
                                    onChange(event);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`barrier-${barrier}`} className="text-sm text-slate-700 dark:text-slate-300">{barrier}</label>
                        </div>
                    ))}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                        <ElegantInput
                            name="barriersOther"
                            label="Other Barriers"
                            value={formData.barriersOther}
                            onChange={onChange}
                            placeholder="Specify other barriers..."
                            className="bg-white/50"
                        />
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6 border border-white/20">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Support Services Needed (Next 30 Days)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        'Resume Development or Update', 'Job Applications Assistance', 'Interview Preparation',
                        'Job Leads/Employer Referrals', 'Work Clothing/PPE', 'Transportation Assistance',
                        'Training or Certification Referral', 'Background-Friendly Employer Referrals', 'Case Management Check-Ins'
                    ].map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`service-${service}`}
                                checked={(formData.supportServices || []).includes(service)}
                                onChange={(e) => {
                                    const current = formData.supportServices || [];
                                    const updated = e.target.checked
                                        ? [...current, service]
                                        : current.filter(s => s !== service);
                                    const event = {
                                        target: {
                                            name: 'supportServices',
                                            value: updated
                                        }
                                    } as any;
                                    onChange(event);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`service-${service}`} className="text-sm text-slate-700 dark:text-slate-300">{service}</label>
                        </div>
                    ))}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                        <ElegantInput
                            name="supportServicesOther"
                            label="Other Services"
                            value={formData.supportServicesOther}
                            onChange={onChange}
                            placeholder="Specify other services..."
                            className="bg-white/50"
                        />
                    </div>
                </div>
            </GlassCard>

        </div>
    );
};
