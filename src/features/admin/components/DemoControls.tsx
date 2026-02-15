"use client";

import React from 'react';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Database, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { useRouter } from 'next/navigation';

export function DemoControls() {
    const router = useRouter();

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
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            System Data Controls
                        </CardTitle>
                        <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                            Manage the mock database state. Changes apply immediately.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900"
                            onClick={() => handleModeSwitch('demo')}
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Load Demo Data
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleModeSwitch('clean')}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset to Blank
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
