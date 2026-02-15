import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export interface TelemetryEvent {
    id: string;
    event_name: string;
    event_type: 'metric' | 'span' | 'error';
    value: number;
    attributes: any;
    created_at: string;
}

export function useTelemetry() {
    const [events, setEvents] = useState<TelemetryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTelemetry = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('telemetry_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) throw error;
            setEvents(data || []);
        } catch (err: any) {
            console.error('Failed to fetch telemetry:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTelemetry();

        // Optional: Real-time subscription
        const channel = supabase
            .channel('telemetry_changes')
            .on(
                'postgres_changes' as any,
                { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
                (payload: any) => {
                    setEvents(prev => [payload.new as TelemetryEvent, ...prev].slice(0, 500));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getMetricsByName = (name: string) => {
        return events.filter(e => e.event_name === name || e.event_name.includes(name));
    };

    const getAverageValue = (name: string) => {
        const relevant = getMetricsByName(name);
        if (relevant.length === 0) return 0;
        const sum = relevant.reduce((acc, curr) => acc + curr.value, 0);
        return sum / relevant.length;
    };

    const getErrorCount = (timeRangeMs: number = 3600000) => {
        const threshold = Date.now() - timeRangeMs;
        return events.filter(e => e.event_type === 'error' && new Date(e.created_at).getTime() > threshold).length;
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
