'use client';

import { useState, useEffect } from 'react';
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ElegantInput } from "@/components/ui/ElegantInput";
import { User, Bell, Shield, Moon, Sun, LogOut, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { authController } from '@/controllers/AuthController';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        // Fetch authenticated user's email
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await authController.logout();
        router.push('/login');
    };

    // Prevent hydration mismatch
    if (!mounted) return null;

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

            <main className="max-w-3xl mx-auto px-6 py-10">
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
                            <ElegantInput
                                label="Email Address"
                                value={userEmail || 'Loading...'}
                                disabled
                            />
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
                                <input type="checkbox" className="toggle" defaultChecked />
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
                                {resolvedTheme === 'dark' ? (
                                    <Moon className="w-5 h-5 text-purple-500" />
                                ) : (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                )}
                                Appearance
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-slate-500">Choose your preferred interface theme and accessibility settings.</p>
                                <AccessibilityToggle />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`
                                        p-4 rounded-xl border-2 bg-slate-900 text-white cursor-pointer 
                                        transition-all duration-200 flex items-center gap-2
                                        ${resolvedTheme === 'dark'
                                            ? 'border-primary ring-2 ring-primary/30'
                                            : 'border-slate-700 hover:border-slate-500'}
                                    `}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark Mode
                                    {resolvedTheme === 'dark' && <Check className="w-4 h-4 text-primary" />}
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`
                                        p-4 rounded-xl border-2 bg-white text-slate-900 cursor-pointer 
                                        transition-all duration-200 flex items-center gap-2
                                        ${resolvedTheme === 'light'
                                            ? 'border-primary ring-2 ring-primary/30'
                                            : 'border-slate-200 hover:border-slate-400'}
                                    `}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light Mode
                                    {resolvedTheme === 'light' && <Check className="w-4 h-4 text-primary" />}
                                </button>
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
