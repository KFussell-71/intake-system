'use client';

import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ElegantInput } from "@/components/ui/ElegantInput";
import { User, Bell, Shield, Moon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authController } from '@/controllers/AuthController';

export default function SettingsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await authController.logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark">
            <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ActionButton variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← Back</ActionButton>
                        <h1 className="text-xl font-bold">Platform Settings</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10 max-w-3xl">
                <div className="space-y-6">
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Profile Settings
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <ElegantInput label="First Name" placeholder="Staff Member" />
                                <ElegantInput label="Last Name" placeholder="Name" />
                            </div>
                            <ElegantInput label="Email Address" value="staff@newbeginning.org" disabled />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Bell className="w-5 h-5 text-accent" /> Notifications
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span>Email Summaries</span>
                                <input type="checkbox" className="toggle" checked readOnly />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Desktop Alerts</span>
                                <input type="checkbox" className="toggle" />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Moon className="w-5 h-5 text-purple-500" /> Appearance
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">Choose your preferred interface theme.</p>
                            <div className="flex gap-4">
                                <div className="p-4 rounded-xl border-2 border-primary bg-slate-900 text-white cursor-pointer">Dark Mode</div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-white text-slate-900 cursor-pointer">Light Mode</div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="pt-6">
                        <ActionButton
                            onClick={handleLogout}
                            className="w-full bg-red-500 hover:bg-red-600 text-white border-none"
                            icon={<LogOut className="w-4 h-4" />}
                        >
                            Sign Out of Session
                        </ActionButton>
                    </div>
                </div>
            </main>
        </div>
    );
}
