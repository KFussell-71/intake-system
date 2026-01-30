'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { ActionButton } from '@/components/ui/ActionButton';
import { motion } from 'framer-motion';
import { authController } from '@/controllers/AuthController';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await authController.login(email, password);

        if (!result.success) {
            setError(result.error || 'Authentication failed');
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-[440px] md:max-w-lg z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 mb-6">
                        <span className="text-white font-bold text-2xl">NB</span>
                    </div>
                    <h1 className="text-4xl font-bold text-primary dark:text-white mb-3">Welcome Back</h1>
                    <p className="text-slate-500 font-medium">New Beginning Outreach Intake Portal</p>
                </div>

                <GlassCard className="p-6 md:p-10 border-white/40">
                    <form onSubmit={handleLogin} className="space-y-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            <ElegantInput
                                label="Email Address"
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                icon={<Mail className="w-5 h-5" />}
                                placeholder="name@agency.org"
                            />

                            <ElegantInput
                                label="Password"
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                icon={<Lock className="w-5 h-5" />}
                                placeholder="••••••••"
                            />
                        </div>

                        <ActionButton
                            type="submit"
                            isLoading={loading}
                            icon={<LogIn className="w-5 h-5" />}
                            className="w-full"
                            size="lg"
                        >
                            Sign In to System
                        </ActionButton>

                        <p className="text-center text-sm text-slate-500 pt-4 font-medium">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-primary font-bold hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </form>
                </GlassCard>

                <p className="mt-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Enterprise Class • HIPAA Compliant • Secure
                </p>
            </motion.div>
        </div>
    );
}
