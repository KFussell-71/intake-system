import React from 'react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../../types/intake';
import { Phone, UserPlus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const EmergencyContactSection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <UserPlus className="w-5 h-5 text-primary" />
                Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <ElegantInput
                        label="Contact Name"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={onChange}
                        placeholder="First Last"
                    />
                </div>
                <div className="md:col-span-1">
                    <ElegantInput
                        label="Phone Number"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={onChange}
                        type="tel"
                        icon={<Phone className="w-4 h-4" />}
                        placeholder="(555) 000-0000"
                    />
                </div>
                <div className="md:col-span-1">
                    <ElegantInput
                        label="Relationship"
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={onChange}
                        placeholder="e.g. Spouse, Parent"
                    />
                </div>
            </div>
        </GlassCard>
    );
};
