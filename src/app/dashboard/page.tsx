'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
    PlusCircle,
    Users,
    History,
    FileText,
    Settings,
    LogOut,
    Search,
    TrendingUp,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { motion } from 'framer-motion';
import { dashboardController } from '@/controllers/DashboardController';
import { authController } from '@/controllers/AuthController';
import { NotificationCenter } from '@/features/dashboard/components/NotificationCenter';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClients: 0,
        activeClients: 0,
        completedIntakes: 0,
        inProgressIntakes: 0,
        pendingIntakes: 0,
        completionRate: 0,
        averageCompletionDays: 0,
        recentActivity: 0,
        // Legacy fields for backward compatibility
        completed: 0,
        inProgress: 0,
        efficiency: 0
    });

    useEffect(() => {
        const initDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Fetch real stats
            const statsResult = await dashboardController.getStats();
            if (statsResult.success && statsResult.data) {
                // Map new stats structure to legacy format
                setStats({
                    ...statsResult.data,
                    // Legacy field mappings for backward compatibility
                    completed: statsResult.data.completedIntakes,
                    inProgress: statsResult.data.inProgressIntakes,
                    efficiency: statsResult.data.completionRate
                });
            }

            setLoading(false);
        };
        initDashboard();
    }, [router]);

    const handleLogout = async () => {
        await authController.logout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark py-12 px-6">
                <div className="animate-pulse text-primary font-heading text-xl">Loading Experience...</div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark selection:bg-accent/30 selection:text-accent">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white font-bold text-xl">N</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">New Beginning</h1>
                            <p className="text-xs text-slate-500 font-medium">Intake & Tracking</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <NotificationCenter />
                        <AccessibilityToggle />
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Staff Member</p>
                        </div>
                        <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            icon={<LogOut className="w-4 h-4" />}
                        >
                            Sign Out
                        </ActionButton>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6"
                >
                    {/* Welcome Section */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-8">
                        <GlassCard className="h-full bg-gradient-to-br from-primary to-primary/80 border-none relative overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4">
                                        Active Session
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                        Good morning,<br />{user?.email?.split('@')[0]}
                                    </h2>
                                    <p className="text-white/60 max-w-md text-lg">
                                        Ready to help more people today? You have no pending reviews for this morning.
                                    </p>
                                </div>
                                <div className="mt-10 flex gap-4">
                                    <ActionButton
                                        onClick={() => router.push('/intake/new')}
                                        icon={<PlusCircle className="w-5 h-5" />}
                                        size="lg"
                                        className="bg-accent text-white border-none shadow-accent/20"
                                    >
                                        Start New Intake
                                    </ActionButton>
                                </div>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        </GlassCard>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-4 grid grid-cols-2 gap-4">
                        <GlassCard className="flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-blue-500/10 rounded-2xl mb-3">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold">{stats.totalClients.toString().padStart(2, '0')}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Clients</p>
                        </GlassCard>
                        <GlassCard className="flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-green-500/10 rounded-2xl mb-3">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold">{stats.completed.toString().padStart(2, '0')}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
                        </GlassCard>
                        <GlassCard className="flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-amber-500/10 rounded-2xl mb-3">
                                <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold">{stats.inProgress.toString().padStart(2, '0')}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">In Progress</p>
                        </GlassCard>
                        <GlassCard className="flex flex-col justify-center items-center text-center hoverable" onClick={() => router.push('/reports')}>
                            <div className="p-3 bg-purple-500/10 rounded-2xl mb-3">
                                <TrendingUp className="w-6 h-6 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold">{stats.efficiency}%</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Efficiency</p>
                        </GlassCard>
                    </motion.div>

                    {/* Navigation Bento */}
                    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/directory')}
                            className="h-full flex flex-col justify-between"
                        >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <Search className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Search Directory</h3>
                                <p className="text-sm text-slate-500">Find any client or historical intake record instantly.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/follow-ups')}
                            className="h-full flex flex-col justify-between"
                        >
                            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                                <History className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-accent">Follow-ups</h3>
                                <p className="text-sm text-slate-500">View clients requiring contact or service updates.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/reports')}
                            className="h-full flex flex-col justify-between"
                        >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <FileText className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Service Reports</h3>
                                <p className="text-sm text-slate-500">Generate analytics and impact summaries for the DOR.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/settings')}
                            className="h-full flex flex-col justify-between"
                        >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <Settings className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Platform Settings</h3>
                                <p className="text-sm text-slate-500">Manage your profile, preferences, and notifications.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Document Management Tile */}
                    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/documents')}
                            className="h-full flex flex-col justify-between border-l-4 border-l-blue-500"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">File Cabinet</h3>
                                <p className="text-sm text-slate-500">Scan, upload, and print client consents & forms.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                </motion.div>
            </main>
        </div>
    );
}
