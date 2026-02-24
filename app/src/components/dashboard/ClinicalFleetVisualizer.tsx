'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Laptop,
    Tablet,
    Activity,
    Wifi,
    ShieldCheck,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface FleetMember {
    name: string;
    ip: string;
    port: number;
    properties: {
        version: string;
        deterministic: string;
        type: string;
        status: string;
    };
    last_seen: number;
}

export function ClinicalFleetVisualizer() {
    const [fleet, setFleet] = useState<FleetMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchFleet = async () => {
        try {
            const res = await fetch('/api/fleet');
            const data = await res.json();
            if (data.success) {
                setFleet(data.fleet);
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('Failed to fetch clinical fleet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
        const interval = setInterval(fetchFleet, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Clinical Fleet Visualizer
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Real-time discovery via P2P Gossip Protocol
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                        Live Status
                    </p>
                    <p className="text-xs font-mono text-primary animate-pulse">
                        ● {fleet.length} Nodes Active
                    </p>
                </div>
            </div>

            {loading && fleet.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary/20 animate-spin" />
                </div>
            ) : fleet.length === 0 ? (
                <GlassCard className="h-48 flex flex-col items-center justify-center text-center border-dashed">
                    <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-medium">No active field devices discovered.</p>
                    <p className="text-[10px] uppercase text-slate-300 tracking-tighter mt-1">
                        Ensure laptops are on the same network
                    </p>
                </GlassCard>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {fleet.map((member) => (
                            <motion.div
                                key={member.name}
                                variants={itemVariants}
                                exit={{ opacity: 0, scale: 0.9 }}
                                layout
                            >
                                <GlassCard className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            {member.properties.type.includes('laptop') ? (
                                                <Laptop className="w-6 h-6 text-primary" />
                                            ) : (
                                                <Tablet className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                                                <Wifi className="w-3 h-3" />
                                                {member.properties.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono mt-1">
                                                {member.ip}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="font-bold text-sm truncate">{member.name.split('.')[0]}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-mono text-slate-500">
                                                v{member.properties.version}
                                            </span>
                                            {member.properties.deterministic === 'true' && (
                                                <span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Deterministic
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtle pulse for active nodes */}
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/5 via-primary to-primary/5 opacity-50 overflow-hidden">
                                        <motion.div
                                            animate={{ x: [-100, 400] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="w-1/4 h-full bg-primary"
                                        />
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-2">
                <p>Mesh Frequency: 5353 MHz (mDNS)</p>
                <p>Last Sync Check: {lastUpdated}</p>
            </div>
        </div>
    );
}
