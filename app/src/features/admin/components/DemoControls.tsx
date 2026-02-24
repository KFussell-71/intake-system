import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Trash2, Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function DemoControls() {
    // SECURITY: Ensure this component NEVER renders in production
    const isDev = process.env.NODE_ENV === 'development';
    const isMockAllowed = process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true';

    if (!isDev || !isMockAllowed) {
        return null;
    }

    const handleModeSwitch = async (mode: 'demo' | 'clean') => {
        // 1. Call Mock RPC to update internal state
        await supabase.rpc('admin_set_mock_mode', { mode });

        // 2. Set Cookie for persistence check in mock.ts constructor
        document.cookie = `mock_mode=${mode}; path=/; max-age=31536000`; // 1 year

        // 3. Reload to reflect changes
        window.location.reload();
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
                            You are currently in <span className="font-semibold text-amber-700 dark:text-amber-300">Demo Mode</span>.
                            These controls manage the simulated database and will never affect production cloud data.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/50 dark:bg-white/5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                            onClick={() => handleModeSwitch('demo')}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Seed Demo Data
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-500/90 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                            onClick={() => handleModeSwitch('clean')}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset to Blank
                        </Button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
