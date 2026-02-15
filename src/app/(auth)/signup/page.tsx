'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { ActionButton } from '@/components/ui/ActionButton';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';

import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            router.push('/login?message=Account created successfully. Please sign in.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-accent/20 mb-6">
                        <UserPlus className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary dark:text-white mb-3">Create Account</h1>
                    <p className="text-slate-500 font-medium">Join the New Beginning Professional Staff</p>
                </div>

                <GlassCard className="p-8 md:p-10">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <ElegantInput
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            icon={<Mail className="w-5 h-5" />}
                            placeholder="name@agency.org"
                        />

                        <ElegantInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            icon={<Lock className="w-5 h-5" />}
                            placeholder="••••••••"
                        />

                        <ElegantInput
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            icon={<Lock className="w-5 h-5" />}
                            placeholder="••••••••"
                        />

                        <ActionButton
                            type="submit"
                            isLoading={loading}
                            icon={<ArrowRight className="w-5 h-5" />}
                            className="w-full"
                            size="lg"
                        >
                            Create Staff Account
                        </ActionButton>

                        <p className="text-center text-sm text-slate-500 pt-4">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
