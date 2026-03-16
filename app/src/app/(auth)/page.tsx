'use client';

import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Heart } from 'lucide-react';

export default function Home() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Vibrant Background Mesh - Restored for High Fidelity */}
            <div className="absolute inset-0 z-0 bg-surface dark:bg-surface-dark transition-colors duration-700">
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/30 rounded-full blur-[160px] animate-pulse pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-accent/30 rounded-full blur-[140px] animate-pulse pointer-events-none"
                    style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[180px] pointer-events-none" />

                {/* Subtle Grain Overly */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <div className="absolute top-6 right-6 z-50">
                <AccessibilityToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center z-10 max-w-2xl px-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm"
                >
                    <Zap className="w-4 h-4 text-primary animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Intelligence & Empathy 2.0</span>
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-black text-primary dark:text-white mb-6 tracking-tighter leading-none">
                    Better Tools for <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent animate-gradient-x">Bigger Impact.</span>
                </h1>

                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-12 leading-relaxed max-w-xl mx-auto">
                    Merging AI-driven clinical precision with a human-first approach to social services. Empowering your mission with data that cares.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <ActionButton
                        onClick={() => router.push('/login')}
                        size="lg"
                        className="min-w-[200px] shadow-2xl shadow-primary/40"
                        icon={<ArrowRight className="w-5 h-5" />}
                    >
                        Access Portal
                    </ActionButton>
                    <ActionButton
                        variant="ghost"
                        size="lg"
                        className="dark:text-white/80"
                        onClick={() => window.open('https://example.com/docs', '_blank')}
                    >
                        Documentation
                    </ActionButton>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard hoverable className="flex flex-col items-center gap-4 py-8 group">
                        <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-black text-lg">Secure</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">PHI Hardened</p>
                    </GlassCard>
                    <GlassCard hoverable className="flex flex-col items-center gap-4 py-8 group">
                        <div className="p-4 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform">
                            <Zap className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="font-black text-lg">Fast</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mistral Edge</p>
                    </GlassCard>
                    <GlassCard hoverable className="flex flex-col items-center gap-4 py-8 group">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                            <Heart className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="font-black text-lg">Human</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Care Oriented</p>
                    </GlassCard>
                </div>
            </motion.div>

            <p className="absolute bottom-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                Â© 2026 New Beginning Outreach â€¢ Engineered for the Antelope Valley
            </p>
        </main>
    );
}

