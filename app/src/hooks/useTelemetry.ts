/**
 * Telemetry Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with Server Actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTelemetryLogsAction } from '@/app/(app)/actions/telemetryActions';

export interface TelemetryEvent {
    id: string;
    eventName: string;
    eventType: 'metric' | 'span' | 'error';
    value: number;
    attributes: any;
    createdAt: Date | string;
}

export function useTelemetry() {
    const [events, setEvents] = useState<TelemetryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTelemetry = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getTelemetryLogsAction();
            if (result.success && result.data) {
                setEvents(result.data as unknown as TelemetryEvent[]);
            } else {
                setError(result.error || 'Failed to fetch telemetry');
            }
        } catch (err: any) {
            console.error('Failed to fetch telemetry:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTelemetry();

        // Optional: Polling every minute for dashboard updates
        const interval = setInterval(fetchTelemetry, 60000);
        return () => clearInterval(interval);
    }, [fetchTelemetry]);

    const getMetricsByName = (name: string) => {
        return events.filter(e => e.eventName === name || e.eventName.includes(name));
    };

    const getAverageValue = (name: string) => {
        const relevant = getMetricsByName(name);
        if (relevant.length === 0) return 0;
        const sum = relevant.reduce((acc, curr) => acc + curr.value, 0);
        return sum / relevant.length;
    };

    const getErrorCount = (timeRangeMs: number = 3600000) => {
        const threshold = Date.now() - timeRangeMs;
        return events.filter(e => e.eventType === 'error' && new Date(e.createdAt).getTime() > threshold).length;
    };

    return {
        events,
        loading,
        error,
        fetchTelemetry,
        getAverageValue,
        getErrorCount,
        getMetricsByName
    };
}
