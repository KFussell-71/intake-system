import React, { useEffect } from 'react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { useIdentity } from '../hooks/useIdentity';
import { Button } from '@/components/ui/button';

interface Props {
    intakeId: string;
    onComplete?: () => void;
}

export const ModernizedIntakeStepIdentity: React.FC<Props> = ({ intakeId, onComplete }) => {
    const { data, loading, saving, error, saveIdentity, saveDraft } = useIdentity(intakeId);

    // Local state for form handling could be added if we want debounce, 
    // but for now we'll pipe directly to saveIdentity on blur or change? 
    // A better UX is local state + save on blur/interval. 
    // For this MVP refactor, let's use a local state buffer.
    const [formData, setFormData] = React.useState(data);

    useEffect(() => {
        if (data) setFormData(data);
    }, [data]);

    if (loading || !formData) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Only save if changed? The hook handles merging.
        saveIdentity({ [name]: value } as any);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-primary" />
                Identity & Basic Info (Modernized)
            </h2>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${formData.sectionStatus === 'complete' ? 'bg-green-100 text-green-700' :
                    formData.sectionStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'
                    }`}>
                    {(formData.sectionStatus || 'not_started').replace('_', ' ').toUpperCase()}
                </span>
                {saving && <span className="text-xs animate-pulse text-primary">Saving...</span>}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-100">
                    Error: {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Full Name"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="First Last"
                />
                <ElegantInput
                    label="Last 4 of SSN"
                    name="ssnLastFour"
                    value={formData.ssnLastFour}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="1234"
                    maxLength={4}
                    required
                />
                <ElegantInput
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="tel"
                    placeholder="(555) 000-0000"
                />
                <ElegantInput
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="email"
                    placeholder="client@example.com"
                />
                <div className="md:col-span-2">
                    <ElegantInput
                        label="Physical Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Street, City, Zip"
                    />
                </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            {/* Minimal Date Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Intake Date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="date"
                    required
                />
                <ElegantInput
                    label="Est. Completion Date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="date"
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    variant="ghost"
                    onClick={() => saveDraft()}
                    disabled={saving}
                    className="mr-auto"
                >
                    Save as Draft
                </Button>

                <Button
                    onClick={() => {
                        saveIdentity({ sectionStatus: 'complete' });
                        onComplete?.();
                    }}
                    disabled={saving}
                >
                    Mark Complete & Continue
                </Button>
            </div>
        </div>
    );
};
