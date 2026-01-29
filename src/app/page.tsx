'use client';

import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Heart } from 'lucide-react';

export default function Home() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />

            <div className="absolute top-6 right-6 z-50">
                <AccessibilityToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center z-10 max-w-2xl px-4"
            >
                <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">New Beginning v2.0</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-primary dark:text-white mb-6 tracking-tight">
                    Better Tools for <span className="text-accent underline decoration-accent/30 underline-offset-8">Bigger Impact.</span>
                </h1>

                <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed">
                    The next generation of intake and client tracking. Designed for professional social services with precision and care.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <ActionButton
                        onClick={() => router.push('/login')}
                        size="lg"
                        icon={<ArrowRight className="w-5 h-5" />}
                    >
                        Access Portal
                    </ActionButton>
                    <ActionButton
                        variant="ghost"
                        size="lg"
                        onClick={() => window.open('https://example.com/docs', '_blank')}
                    >
                        Documentation
                    </ActionButton>
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Secure</h3>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Fast</h3>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5">
                            <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold">Care-focused</h3>
                    </div>
                </div>
            </motion.div>

            <p className="absolute bottom-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                © 2026 New Beginning Outreach • Empowering Lives Through Innovation
            </p>
        </main>
    );
}
