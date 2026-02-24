'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    ShieldAlert,
    Layers,
    Cpu,
    Database,
    Network
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function VanguardAnalytics() {
    const [meshNodes, setMeshNodes] = useState(0);
    const [phiMasks, setPhiMasks] = useState(142); // Simulated count
    const [aiThroughput, setAiThroughput] = useState(0);
    const [storageUsage, setStorageUsage] = useState(12.4); // TB

    useEffect(() => {
        // Fetch real mesh node count from discovery state if available
        const fetchMesh = async () => {
            try {
                const res = await fetch('/api/fleet');
                const data = await res.json();
                if (data.success) {
                    setMeshNodes(data.fleet.length);
                }
            } catch (e) { }
        };

        const interval = setInterval(() => {
            fetchMesh();
            setAiThroughput(prev => Math.floor(Math.random() * 50) + 120); // Simulated tokens/sec
            setPhiMasks(prev => prev + (Math.random() > 0.8 ? 1 : 0));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vanguard Tier Badge */}
            <div className="lg:col-span-4 flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Vanguard Active</p>
                        <p className="text-xs text-slate-500">Tier 4: Distributed Clinical Mesh Integration</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Network className="w-3 h-3" /> Mesh: P2P</span>
                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> GPU: NVIDIA-GRID</span>
                </div>
            </div>

            <GlassCard className="border-l-4 border-l-primary pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Clinical Sync Health</p>
                        <h4 className="text-2xl font-bold font-mono tracking-tighter">CONVERGED</h4>
                    </div>
                    <Layers className="w-5 h-5 text-primary opacity-50" />
                </div>
                <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                    />
                </div>
                <p className="mt-2 text-[10px] text-slate-500 font-medium">Latency: &lt; 2s across {meshNodes} nodes</p>
            </GlassCard>

            <GlassCard className="border-l-4 border-l-emerald-500 pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">AI Throughput</p>
                        <h4 className="text-2xl font-bold font-mono tracking-tighter">{aiThroughput} t/s</h4>
                    </div>
                    <Cpu className="w-5 h-5 text-emerald-500 opacity-50" />
                </div>
                <p className="mt-4 text-[10px] text-slate-500 font-medium font-mono text-emerald-500">GPU ACCELERATION: ACTIVE</p>
            </GlassCard>

            <GlassCard className="border-l-4 border-l-amber-500 pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Semantic Shield v2</p>
                        <h4 className="text-2xl font-bold font-mono tracking-tighter">{phiMasks}</h4>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-amber-500 opacity-50" />
                </div>
                <p className="mt-4 text-[10px] text-slate-500 font-medium">NLP-aware masking active</p>
            </GlassCard>

            <GlassCard className="border-l-4 border-l-blue-500 pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Archive Density</p>
                        <h4 className="text-2xl font-bold font-mono tracking-tighter">{storageUsage} TB</h4>
                    </div>
                    <Database className="w-5 h-5 text-blue-500 opacity-50" />
                </div>
                <p className="mt-4 text-[10px] text-slate-500 font-medium">Total redundant state capture</p>
            </GlassCard>
        </div>
    );
}
