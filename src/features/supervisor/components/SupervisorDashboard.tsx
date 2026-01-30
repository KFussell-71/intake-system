'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { ReadinessTrendChart } from '@/features/reports/components/ReadinessTrendChart';
import { BarriersRemovalChart } from '@/features/reports/components/BarriersRemovalChart';

export const SupervisorDashboard: React.FC = () => {
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchReviews = async () => {
            const { data, error } = await supabase
                .from('report_reviews')
                .select(`
                    id,
                    status,
                    created_at,
                    clients ( name ),
                    profiles!report_reviews_created_by_fkey ( username )
                `)
                .eq('status', 'pending');

            if (data) {
                setReviews((data as any[]).map(r => ({
                    id: r.id,
                    client: r.clients?.name || 'Unknown',
                    type: 'Intake Report',
                    date: new Date(r.created_at).toLocaleDateString(),
                    specialist: r.profiles?.username || 'Staff'
                })));
            }
            setLoading(false);
        };
        fetchReviews();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Supervisor Review Queue</h2>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Filter by Specialist</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReadinessTrendChart />
                <BarriersRemovalChart />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800 uppercase">Pending Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-900">{reviews.length}</div>
                        <p className="text-xs text-orange-700 mt-1">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 uppercase">Approved This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">12</div>
                        <p className="text-xs text-emerald-700 mt-1">On track</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 uppercase">Avg Turnaround</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-900">4.2h</div>
                        <p className="text-xs text-blue-700 mt-1">Target: &lt; 24h</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                        <tr>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Report Type</th>
                            <th className="px-6 py-3">Submitted By</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reviews.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 text-slate-800">
                                <td className="px-6 py-4 font-medium">{r.client}</td>
                                <td className="px-6 py-4">{r.type}</td>
                                <td className="px-6 py-4">{r.specialist}</td>
                                <td className="px-6 py-4 text-gray-500">{r.date}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <XCircle className="w-4 h-4 mr-1" /> Returns
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
