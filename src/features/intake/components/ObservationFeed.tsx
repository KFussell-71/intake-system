'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eye, Plus, UserCheck, ScrollText, AlertCircle } from 'lucide-react';
import { addObservationAction } from '@/app/actions/observationActions';

interface ObservationFeedProps {
    intakeId: string;
    domain: string;
}

/**
 * ObservationFeed
 * SME: Clinical Narrative & Evidence Domain
 */
export const ObservationFeed: React.FC<ObservationFeedProps> = ({ intakeId, domain }) => {
    const [value, setValue] = useState('');
    const [source, setSource] = useState<'client' | 'counselor' | 'document'>('client');
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!value.trim()) return;
        setSaving(true);
        try {
            await addObservationAction(intakeId, domain, value, source);
            setValue('');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-white/50 px-1">
                <Eye size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Assertion Ledger: {domain}</span>
            </div>

            <div className="flex gap-2">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`New ${domain} observation...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />

                <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/50 focus:outline-none"
                >
                    <option value="client">Client Voice</option>
                    <option value="counselor">Counselor Obs</option>
                    <option value="document">Document Ref</option>
                </select>

                <button
                    onClick={handleAdd}
                    disabled={saving || !value.trim()}
                    className="p-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 disabled:opacity-30 transition-all"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* In a real implementation, we would list recent assertions here */}
            {/* Fetched from 'observations' table for this intake_id and domain */}
        </div>
    );
};
