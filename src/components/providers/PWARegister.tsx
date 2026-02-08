'use client';

import { useEffect } from 'react';
import { SyncManager } from '@/lib/offline/syncManager';
import { registerDomainEventHandlers } from '@/infrastructure/messaging/EventHandlers';

export function PWARegister() {
    useEffect(() => {
        // Initialize Sync Manager
        SyncManager.init();

        // Initialize Domain Event Handlers
        registerDomainEventHandlers();

        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('SW registered: ', registration);
                    },
                    (registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    }
                );
            });
        }
    }, []);

    return null;
}
