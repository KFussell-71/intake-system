'use client';

import { useRouter } from 'next/navigation';
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
    Eye,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { motion } from 'framer-motion';
import { authController } from '@/controllers/AuthController';
import { NotificationCenter } from '@/features/dashboard/components/NotificationCenter';
import { DashboardStats } from '@/types/dashboard';
import { Greeting } from '@/features/dashboard/components/Greeting';

// Dynamic imports
const IntakeTrendChart = dynamic(() => import('@/components/dashboard/AnalyticsCharts').then(mod => mod.IntakeTrendChart), {
    loading: () => <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" />
});
const WorkloadBarChart = dynamic(() => import('@/components/dashboard/AnalyticsCharts').then(mod => mod.WorkloadBarChart), {
    loading: () => <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" />
});
const ActivityFeed = dynamic(() => import('@/components/dashboard/ActivityFeed').then(mod => mod.ActivityFeed), {
    loading: () => <div className="space-y-4 pt-4"><div className="h-10 animate-pulse bg-slate-100 dark:bg-white/5 rounded-lg" /></div>
});
const StaffingForecastWidget = dynamic(() => import('@/features/dashboard/components/StaffingForecastWidget').then(mod => mod.StaffingForecastWidget));
const PolicySimulator = dynamic(() => import('@/features/simulation/components/PolicySimulator').then(mod => mod.PolicySimulator));
const ComparabilityWidget = dynamic(() => import('@/features/comparability/components/ComparabilityWidget').then(mod => mod.ComparabilityWidget));
const ClinicalFleetVisualizer = dynamic(() => import('@/components/dashboard/ClinicalFleetVisualizer').then(mod => mod.ClinicalFleetVisualizer));
const VanguardAnalytics = dynamic(() => import('@/components/dashboard/VanguardAnalytics').then(mod => mod.VanguardAnalytics));
const ManualSyncExport = dynamic(() => import('@/components/dashboard/ManualSyncExport').then(mod => mod.ManualSyncExport));

interface DashboardClientProps {
    stats: DashboardStats;
    user: any;
    role: string;
}

export function DashboardClient({ stats, user, role }: DashboardClientProps) {
    const router = useRouter();
    const isSupervisor = role === 'supervisor' || role === 'admin';

    const handleLogout = async () => {
        await authController.logout();
        router.push('/login');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const totalClients = isSupervisor ?
        stats.staffWorkload.reduce((acc, curr) => acc + curr.active_clients, 0) :
        stats.myWorkload?.active_clients || 0;

    const activeCases = isSupervisor ?
        stats.staffWorkload.reduce((acc, curr) => acc + curr.intakes_in_progress, 0) :
        stats.myWorkload?.intakes_in_progress || 0;

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark selection:bg-accent/30 selection:text-accent relative overflow-hidden">
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
                            <span>Search</span>
                        </ActionButton>
                        <NotificationCenter />
                        <AccessibilityToggle />
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold">{user.email?.split('@')[0] || user.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{role}</p>
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
                        <GlassCard className="h-full bg-linear-to-br from-primary to-primary/80 border-none relative overflow-hidden">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <Greeting user={user} />
                                    <p className="text-white/60 max-w-md text-lg">
                                        {isSupervisor
                                            ? `Team currently managing ${activeCases} active intakes across ${stats.staffWorkload.length} staff members.`
                                            : `You have ${activeCases} intakes in progress and ${totalClients} active clients.`}
                                    </p>
                                </div>
                                <div className="mt-10 flex gap-4">
                                    <ActionButton onClick={() => router.push('/intake/new')} icon={<PlusCircle className="w-5 h-5" />} size="lg" className="bg-accent text-white border-none shadow-accent/20">
                                        Start New Intake
                                    </ActionButton>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Quick Stats */}
                    <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <GlassCard className="flex flex-col justify-center items-center text-center">
                                <Users className="w-6 h-6 text-blue-500 mb-2" />
                                <p className="text-2xl font-bold">{totalClients}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Total Clients</p>
                            </GlassCard>
                            <GlassCard className="flex flex-col justify-center items-center text-center">
                                <Clock className="w-6 h-6 text-amber-500 mb-2" />
                                <p className="text-2xl font-bold">{activeCases}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400">In Progress</p>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-6">
                        <GlassCard className="h-full min-h-[400px]">
                            <History className="w-5 h-5 text-slate-500 mb-4" />
                            <ActivityFeed items={stats.recentActivity} />
                        </GlassCard>
                    </motion.div>

                    {/* Navigation Bento */}
                    <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-6 grid grid-cols-2 gap-6">
                        {[
                            { name: 'Directory', path: '/directory', icon: <Search />, desc: 'Search clients' },
                            { name: 'Follow-ups', path: '/follow-ups', icon: <Clock />, desc: 'Daily Tasks' },
                            { name: 'Files', path: '/documents', icon: <FileText />, desc: 'Manage docs' },
                            { name: 'Reports', path: '/reports', icon: <FileText />, desc: 'Export data' }
                        ].map(item => (
                            <GlassCard key={item.name} hoverable onClick={() => router.push(item.path)}>
                                <div className="mb-2">{item.icon}</div>
                                <h3 className="font-bold">{item.name}</h3>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </GlassCard>
                        ))}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}

