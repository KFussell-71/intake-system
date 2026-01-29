'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { Mail, ArrowRight } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';

export default function ClientPortalLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock login
        setTimeout(() => {
            router.push('/portal/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-6">
            <GlassCard className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Client Portal</h1>
                    <p className="text-slate-500">Access your case status and upload documents.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <ElegantInput
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        icon={<Mail className="w-5 h-5" />}
                        required
                    />

                    <ActionButton
                        type="submit"
                        fullWidth
                        isLoading={loading}
                        icon={<ArrowRight className="w-5 h-5" />}
                    >
                        Send Magic Link
                    </ActionButton>
                </form>
            </GlassCard>
        </div>
    );
}
