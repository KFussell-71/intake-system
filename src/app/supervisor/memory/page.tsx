"use client";

import { useEffect, useState } from "react";
import { getSystemLogs, logSystemAction, SystemMemoryLog } from "@/app/actions/memoryActions";
import { GlassCard } from "@/components/ui/GlassCard";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiCpu, FiRotateCw } from "react-icons/fi";
import { toast } from "sonner";

export default function SystemMemoryPage() {
    const [logs, setLogs] = useState<SystemMemoryLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const data = await getSystemLogs();
            setLogs(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load system logs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualLog = async () => {
        const description = prompt("Enter a manual log description:");
        if (!description) return;

        try {
            await logSystemAction({
                action_type: 'Correction',
                description,
                metadata: { source: 'manual_supervisor_entry' }
            });
            toast.success("Log added");
            loadLogs();
        } catch (error) {
            toast.error("Failed to add log");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Generation': return <FiCpu className="text-blue-500" />;
            case 'Correction': return <FiAlertCircle className="text-red-500" />;
            case 'Action': return <FiCheckCircle className="text-green-500" />;
            default: return <FiActivity className="text-gray-500" />;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        System Memory
                    </h1>
                    <p className="text-gray-500 mt-2">Audit log of AI actions, generations, and corrections.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadLogs} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <FiRotateCw />
                    </button>
                    <button onClick={handleManualLog} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Add Manual Entry
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-gray-500 animate-pulse">Loading memory...</p>
                ) : logs.length === 0 ? (
                    <p className="text-gray-500 italic">System memory is empty.</p>
                ) : (
                    logs.map((log) => (
                        <GlassCard key={log.id} className="p-4 flex gap-4 items-start">
                            <div className="mt-1 text-xl">{getIcon(log.action_type)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">{log.action_type}</h3>
                                    <span className="text-xs text-gray-400">
                                        {new Date(log.created_at!).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-gray-700 mt-1">{log.description}</p>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
