'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function ClientLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [ssn4, setSsn4] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Find client by email and SSN4
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('email', email)
                .eq('ssn_last_four', ssn4)
                .single();

            if (fetchError || !data) {
                throw new Error('Invalid credentials. Please verify your email and the last 4 digits of your SSN.');
            }

            // In a real production app, we would use Supabase Auth with a custom claim or a secure session.
            // For this portal, we will store the client ID in sessionStorage for the session duration.
            sessionStorage.setItem('portal_client_id', data.id);
            sessionStorage.setItem('portal_client_name', data.name);

            router.push('/portal/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -ml-40 -mb-40" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Client Portal</h1>
                    <p className="text-slate-500 font-medium">Securely access your New Beginning journey.</p>
                </div>

                <GlassCard className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Last 4 of SSN</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    maxLength={4}
                                    required
                                    value={ssn4}
                                    onChange={(e) => setSsn4(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <ActionButton
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg"
                            isLoading={loading}
                        >
                            Enter Portal
                        </ActionButton>
                    </form>
                </GlassCard>

                <p className="mt-8 text-center text-sm text-slate-400">
                    Having trouble logging in? Contact your Case Manager at <span className="text-primary font-bold">New Beginning</span>.
                </p>
            </motion.div>
        </div>
    );
}
