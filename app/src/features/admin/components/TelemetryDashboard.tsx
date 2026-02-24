import React from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Activity,
    AlertCircle,
    Zap,
    RefreshCw,
    ShieldCheck,
    LineChart as ChartIcon,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const TelemetryDashboard: React.FC = () => {
    const { events, loading, getAverageValue, getErrorCount } = useTelemetry();

    if (loading && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <p className="font-medium">Aggregating system telemetry...</p>
            </div>
        );
    }

    // Process data for charts
    const latencyData = events
        .filter(e => e.event_name.startsWith('duration_'))
        .slice(0, 20)
        .reverse()
        .map(e => ({
            time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ms: e.value,
            name: e.event_name.replace('duration_', '')
        }));

    const errorCount = getErrorCount();
    const avgLatency = getAverageValue('duration_AI');

    const errorDistribution = [
        { name: 'AI Proxy', value: events.filter(e => e.event_name.includes('AI') && e.event_type === 'error').length },
        { name: 'Sync', value: events.filter(e => e.event_name.includes('sync') && e.event_type === 'error').length },
        { name: 'Database', value: events.filter(e => e.event_name.includes('DB') && e.event_type === 'error').length },
        { name: 'Other', value: events.filter(e => e.event_type === 'error' && !['AI', 'sync', 'DB'].some(k => e.event_name.includes(k))).length },
    ].filter(d => d.value > 0);

    const riskDistribution = [
        { name: 'Routine', value: events.filter(e => e.event_name === 'clinical_urgency_score' && e.value <= 20).length },
        { name: 'Elevated', value: events.filter(e => e.event_name === 'clinical_urgency_score' && e.value > 20 && e.value <= 50).length },
        { name: 'High', value: events.filter(e => e.event_name === 'clinical_urgency_score' && e.value > 50 && e.value <= 80).length },
        { name: 'Critical', value: events.filter(e => e.event_name === 'clinical_urgency_score' && e.value > 80).length },
    ];

    return (
        <div className="space-y-8 p-4">
            <header className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-white/20 backdrop-blur-xl">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        System Health Shadow Audit
                    </h2>
                    <p className="text-slate-500 font-medium">Real-time observability and clinical integrity monitoring.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Live Feed Active
                </div>
            </header>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Avg AI Latency"
                    value={`${Math.round(avgLatency)}ms`}
                    icon={<Zap className="text-amber-500" />}
                    trend={{ value: '12%', up: true }}
                />
                <MetricCard
                    title="Error Rate (1h)"
                    value={errorCount.toString()}
                    icon={<AlertCircle className="text-red-500" />}
                    trend={{ value: '5%', up: false }}
                    variant={errorCount > 0 ? 'warning' : 'success'}
                />
                <MetricCard
                    title="Active Sync tasks"
                    value={events.filter(e => e.event_name === 'sync_queue_size')[0]?.value?.toString() || '0'}
                    icon={<RefreshCw className="text-blue-500" />}
                />
                <MetricCard
                    title="Avg Risk Score"
                    value={`${Math.round(getAverageValue('clinical_urgency_score'))}%`}
                    icon={<ShieldCheck className="text-emerald-500" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Distribution Chart */}
                <GlassCard className="p-6">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Clinical Risk Distribution
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Error Distribution */}
                <GlassCard className="p-6">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Failure Distribution
                    </h3>
                    <div className="h-[300px] flex">
                        <ResponsiveContainer width="60%" height="100%">
                            <PieChart>
                                <Pie
                                    data={errorDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {errorDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-[40%] flex flex-col justify-center space-y-4">
                            {errorDistribution.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs font-bold text-slate-400">{d.name}</span>
                                    <span className="text-xs font-mono ml-auto">{d.value}</span>
                                </div>
                            ))}
                            {errorDistribution.length === 0 && (
                                <div className="text-center text-slate-500 text-sm">No errors detected</div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Latency Chart */}
            <GlassCard className="p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                    <ChartIcon className="w-5 h-5 text-indigo-500" />
                    AI Provider Latency (ms)
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={latencyData}>
                            <defs>
                                <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#818cf8' }}
                            />
                            <Area type="monotone" dataKey="ms" stroke="#6366f1" fillOpacity={1} fill="url(#colorMs)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: { value: string, up: boolean };
    variant?: 'default' | 'success' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, variant = 'default' }) => {
    return (
        <GlassCard className="p-6 hover:translate-y-[-4px] transition-transform cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend.value}
                    </div>
                )}
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h4>
            <p className={`text-3xl font-black ${variant === 'error' ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{value}</p>
        </GlassCard>
    );
};
