'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { getPendingTasks } from '@/lib/offline/db';

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateStatus = async () => {
            setIsOnline(navigator.onLine);
            const tasks = await getPendingTasks();
            setPendingCount(tasks.length);
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        // Check pending tasks every 30 seconds
        const interval = setInterval(updateStatus, 30000);

        updateStatus();

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            clearInterval(interval);
        };
    }, []);

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:w-80 p-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 duration-300 ${!isOnline ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
            }`}>
            {!isOnline ? (
                <WifiOff className="h-5 w-5 shrink-0" />
            ) : (
                <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
            )}

            <div className="flex-1 text-sm font-medium">
                {!isOnline ? (
                    'Working Offline'
                ) : (
                    `Syncing ${pendingCount} pending task${pendingCount > 1 ? 's' : ''}...`
                )}
            </div>

            <div className="text-[10px] opacity-75 whitespace-nowrap">
                {!isOnline ? 'Drafts stored locally' : 'Persisting data...'}
            </div>
        </div>
    );
}
