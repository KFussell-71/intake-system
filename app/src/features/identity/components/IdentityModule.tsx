'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { useIdentity } from '@/features/intake/hooks/useIdentity';
import { User, Phone, Mail, MapPin, Hash, Calendar } from 'lucide-react';

interface IdentityModuleProps {
    intakeId: string;
    onStatusChange?: (status: string) => void;
}

/**
 * IdentityModule
 * SME: Personal Identifiable Information (PII) Domain
 * Isolated from the monolithic form Object.
 */
export const IdentityModule: React.FC<IdentityModuleProps> = ({ intakeId, onStatusChange }) => {
    const { data: identity, loading, updateField, saveIdentity } = useIdentity(intakeId);

    if (loading || !identity) return <div className="p-8 text-center animate-pulse text-white/50">Loading Identity Domain...</div>;

    const handleBlur = async () => {
        const result = await saveIdentity();
        if (result.success && onStatusChange) {
            onStatusChange('saved');
        }
    };

    return (
        <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <User size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white">Identity & Demographics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Full Name"
                    value={identity.clientName || ''}
                    onChange={(v) => updateField('clientName', v)}
                    onBlur={handleBlur}
                    icon={<User size={18} />}
                    placeholder="John Doe"
                />
                <ElegantInput
                    label="Phone Number"
                    value={identity.phone || ''}
                    onChange={(v) => updateField('phone', v)}
                    onBlur={handleBlur}
                    icon={<Phone size={18} />}
                    placeholder="(555) 000-0000"
                />
                <ElegantInput
                    label="Email Address"
                    value={identity.email || ''}
                    onChange={(v) => updateField('email', v)}
                    onBlur={handleBlur}
                    icon={<Mail size={18} />}
                    placeholder="john@example.com"
                />
                <ElegantInput
                    label="Address"
                    value={identity.address || ''}
                    onChange={(v) => updateField('address', v)}
                    onBlur={handleBlur}
                    icon={<MapPin size={18} />}
                    placeholder="123 Main St, City, State"
                />
                <ElegantInput
                    label="SSN (Last 4)"
                    value={identity.ssnLastFour || ''}
                    onChange={(v) => updateField('ssnLastFour', v)}
                    onBlur={handleBlur}
                    icon={<Hash size={18} />}
                    maxLength={4}
                    placeholder="0000"
                />
                <ElegantInput
                    label="Date of Birth"
                    type="date"
                    value={identity.birthDate ? identity.birthDate.split('T')[0] : ''}
                    onChange={(v) => updateField('birthDate', v)}
                    onBlur={handleBlur}
                    icon={<Calendar size={18} />}
                />
            </div>
        </GlassCard>
    );
};
