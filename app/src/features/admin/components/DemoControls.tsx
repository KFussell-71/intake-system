'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { setMockModeAction } from '@/app/(app)/actions/adminActions';
import { toast } from 'sonner';

/**
 * DemoControls Component (Refactored)
 * 
 * Replaces direct Supabase RPC with secure Server Action.
 * Manages development data states with session-aware persistence.
 */
export function DemoControls() {
    const isDev = process.env.NODE_ENV === 'development';
    const isMockAllowed = process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true';

    if (!isDev || !isMockAllowed) {
        return null;
    }

    const handleModeSwitch = async (mode: 'demo' | 'clean') => {
        try {
            const result = await setMockModeAction(mode);
            if (result.success) {
                toast.success(`Switched to ${mode} mode. Reloading...`);
                // Delay reload to let user see toast
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error('Failed to switch mode: ' + result.error);
            }
        } catch (err) {
            toast.error('Internal Error');
        }
    };

    return (
        <GlassCard className="border-amber-500/30 bg-amber-500/5 backdrop-blur-md">
            <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <ShieldCheck className="w-5 h-5" />
                            <h3 className="font-bold tracking-tight">System Data Guard</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                            You are currently in <span className="font-semibold text-amber-700 dark:text-amber-300">Development Mode</span>.
                            These controls manage the simulated database and will never affect production cloud data.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/50 dark:bg-white/5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all font-bold"
                            onClick={() => handleModeSwitch('demo')}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Seed Demo Data
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-500/90 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all font-bold"
                            onClick={() => handleModeSwitch('clean')}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset System
                        </Button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
