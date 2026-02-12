'use client';

import { useEffect, useState } from 'react';
import { Referral, referralService } from '@/services/ReferralService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calendar, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
    caseId: string;
}

export function ReferralTracker({ caseId }: Props) {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReferrals();
    }, [caseId]);

    const loadReferrals = async () => {
        try {
            const data = await referralService.getReferrals(caseId);
            setReferrals(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (referralId: string, newStatus: string) => {
        try {
            await referralService.updateReferralStatus(referralId, newStatus);
            toast.success('Referral status updated');
            loadReferrals(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="h-24 bg-slate-50 animate-pulse rounded-xl" />;

    if (referrals.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No active referrals. Use the directory to find partners.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {referrals.map(referral => (
                <GlassCard key={referral.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mt-1">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {referral.provider?.name || 'Unknown Provider'}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="uppercase tracking-wide font-medium">{referral.provider?.category}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(referral.referral_date), 'MMM d, yyyy')}
                                </span>
                            </div>
                            {referral.outcome_notes && (
                                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                    {referral.outcome_notes}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 min-w-[160px]">
                        <Badge variant="outline" className={`
                            ${referral.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            ${referral.status === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${referral.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${referral.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        `}>
                            {referral.status.toUpperCase()}
                        </Badge>

                        {/* Status Actions */}
                        <Select
                            defaultValue={referral.status}
                            onValueChange={(val) => handleStatusUpdate(referral.id, val)}
                        >
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}
