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
    Clock,
    BarChart3,
    Activity,
    Eye,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { motion } from 'framer-motion';
import { dashboardController } from '@/controllers/DashboardController';
import { authController } from '@/controllers/AuthController';
import { NotificationCenter } from '@/features/dashboard/components/NotificationCenter';
import { IntakeTrendChart, WorkloadBarChart } from '@/components/dashboard/AnalyticsCharts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { StaffingForecastWidget } from '@/features/dashboard/components/StaffingForecastWidget';
import { PolicySimulator } from '@/features/simulation/components/PolicySimulator';
import { ComparabilityWidget } from '@/features/comparability/components/ComparabilityWidget';
import { DashboardStats } from '@/types/dashboard';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initDashboard = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            if (!isMounted) return;
            setUser(session.user);

            // Fetch role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            if (!isMounted) return;
            setRole(profile?.role || 'staff');

            // Fetch real stats
            const statsResult = await dashboardController.getStats();
            if (isMounted && statsResult.success && statsResult.data) {
                // Assert type safety here since controller returns generic data wrapper
                setStats(statsResult.data as DashboardStats);
            }

            if (isMounted) {
                setLoading(false);
            }
        };
        initDashboard();

        return () => {
            isMounted = false;
        };
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

    const isSupervisor = role === 'supervisor' || role === 'admin';

    // Calculate dynamic aggregates
    const totalClients = isSupervisor ?
        stats?.staffWorkload.reduce((acc, curr) => acc + curr.active_clients, 0) || 0 :
        stats?.myWorkload?.active_clients || 0;

    const activeCases = isSupervisor ?
        stats?.staffWorkload.reduce((acc, curr) => acc + curr.intakes_in_progress, 0) || 0 :
        stats?.myWorkload?.intakes_in_progress || 0;

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
                        <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => window.dispatchEvent(new Event('open-global-search'))}
                            icon={<Search className="w-4 h-4" />}
                            className="hidden md:flex"
                        >
                            <span className="hidden lg:inline">Search</span>
                            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                <span className="text-xs">⌘K</span>
                            </kbd>
                        </ActionButton>
                        <NotificationCenter />
                        <AccessibilityToggle />
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{role || 'Staff'}</p>
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
                                        {isSupervisor ? 'Supervisor Dashboard' : 'My Workspace'}
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                        Good morning,<br />{user?.email?.split('@')[0]}
                                    </h2>
                                    <p className="text-white/60 max-w-md text-lg">
                                        {isSupervisor
                                            ? `Team currently managing ${activeCases} active intakes across ${stats?.staffWorkload.length || 0} staff members.`
                                            : `You have ${activeCases} intakes in progress and ${stats?.myWorkload?.active_clients || 0} active clients.`}
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
                                    <ActionButton
                                        onClick={() => router.push('/modernized-intake/new')}
                                        icon={<TrendingUp className="w-5 h-5" />}
                                        size="lg"
                                        className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                                    >
                                        Try New Experience (Beta)
                                    </ActionButton>
                                </div>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        </GlassCard>
                    </motion.div>

                    {/* Quick Stats - Dynamic */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-4 grid grid-cols-2 gap-4">
                        <GlassCard className="flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-blue-500/10 rounded-2xl mb-3">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold">{totalClients}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Clients</p>
                        </GlassCard>
                        <GlassCard className="flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-amber-500/10 rounded-2xl mb-3">
                                <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold">{activeCases}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">In Progress</p>
                        </GlassCard>
                        <GlassCard className="col-span-2 flex flex-col justify-center items-center text-center">
                            <div className="p-3 bg-purple-500/10 rounded-2xl mb-3">
                                <Activity className="w-6 h-6 text-purple-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Latest Activity</p>
                            <p className="text-xs text-slate-400 max-w-[200px] truncate">
                                {stats?.recentActivity?.[0]?.description || 'No recent activity'}
                            </p>
                        </GlassCard>
                    </motion.div>

                    {/* Analytics Section - Supervisor Only */}
                    {isSupervisor && stats && (
                        <>
                            <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-8">
                                <GlassCard className="h-full">
                                    <div className="flex items-center gap-2 mb-6">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                        <h3 className="text-lg font-bold">Intake Volume Trends</h3>
                                    </div>
                                    <IntakeTrendChart data={stats.intakeTrends} />
                                </GlassCard>
                            </motion.div>
                            <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-4 space-y-6">
                                {/* Staffing Optimization Widget */}
                                <div className="h-[300px]">
                                    <StaffingForecastWidget />
                                </div>
                                {/* Policy Simulation Widget */}
                                <div className="h-auto">
                                    <PolicySimulator />
                                </div>
                                {/* Comparability Widget */}
                                <div className="h-auto">
                                    <ComparabilityWidget />
                                </div>
                                <GlassCard className="h-auto">
                                    <div className="flex items-center gap-2 mb-6">
                                        <BarChart3 className="w-5 h-5 text-orange-500" />
                                        <h3 className="text-lg font-bold">Team Workload</h3>
                                    </div>
                                    <WorkloadBarChart data={stats.staffWorkload} />
                                </GlassCard>
                            </motion.div>
                        </>
                    )}

                    {/* Activity Feed - Everyone */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-6">
                        <GlassCard className="h-full min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <History className="w-5 h-5 text-slate-500" />
                                    <h3 className="text-lg font-bold">Recent Activity</h3>
                                </div>
                                <span className="text-xs text-slate-400">Last 10 events</span>
                            </div>
                            {stats?.recentActivity && <ActivityFeed items={stats.recentActivity} />}
                        </GlassCard>
                    </motion.div>

                    {/* Navigation Bento (Reduced) */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-6 grid grid-cols-2 gap-6">
                        <GlassCard
                            hoverable
                            onClick={() => router.push('/directory')}
                            className="flex flex-col justify-between"
                        >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4">
                                <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Directory</h3>
                                <p className="text-xs text-slate-500">Search clients</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/follow-ups')}
                            className="flex flex-col justify-between border-l-4 border-l-amber-500"
                        >
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Follow-ups</h3>
                                <p className="text-xs text-slate-500">Daily Tasks</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/documents')}
                            className="flex flex-col justify-between border-l-4 border-l-blue-500"
                        >
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Files</h3>
                                <p className="text-xs text-slate-500">Manage docs</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/reports')}
                            className="flex flex-col justify-between"
                        >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4">
                                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Reports</h3>
                                <p className="text-xs text-slate-500">Export data</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/settings')}
                            className="flex flex-col justify-between"
                        >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4">
                                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Settings</h3>
                                <p className="text-xs text-slate-500">Preferences</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/dashboard/accreditation')}
                            className="flex flex-col justify-between border-l-4 border-l-emerald-500"
                        >
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                                <FileText className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Accreditation</h3>
                                <p className="text-xs text-slate-500">Audit Proof</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/dashboard/transparency')}
                            className="flex flex-col justify-between border-l-4 border-l-cyan-500"
                        >
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Eye className="w-5 h-5 text-cyan-500" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Transparency</h3>
                                <p className="text-xs text-slate-500">Public Trust</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/cases')}
                            className="flex flex-col justify-between border-l-4 border-l-indigo-500"
                        >
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Briefcase className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">My Cases</h3>
                                <p className="text-xs text-slate-500">Active Caseload</p>
                            </div>
                        </GlassCard>

                        <GlassCard
                            hoverable
                            onClick={() => router.push('/auditor/reports')}
                            className="flex flex-col justify-between border-l-4 border-l-slate-900 dark:border-l-white"
                        >
                            <div className="w-10 h-10 bg-slate-900/10 dark:bg-white/10 rounded-xl flex items-center justify-center mb-4">
                                <ShieldCheck className="w-5 h-5 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Auditor Portal</h3>
                                <p className="text-xs text-slate-500">Compliance & Review</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            </main>
        </div >
    );
}
