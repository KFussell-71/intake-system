'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { generateGmailLink } from '@/lib/googleUtils';
import InviteToPortalButton from '@/features/clients/components/InviteToPortalButton';
import { useRouter } from 'next/navigation';

interface ReviewQueueTableProps {
    reviews: any[];
    selectedIds: Set<string>;
    currentUserId: string | null;
    onToggleSelection: (id: string) => void;
    onToggleSelectAll: (checked: boolean) => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
    reviews,
    selectedIds,
    currentUserId,
    onToggleSelection,
    onToggleSelectAll
}) => {
    const router = useRouter();

    return (
        <div className="bg-white rounded-md border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">Review Queue</h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">{reviews.length} Pending</span>
                </div>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                    <tr>
                        <th className="w-12 px-6 py-3 text-center">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={reviews.length > 0 && selectedIds.size === reviews.filter(r => r.counselorId !== currentUserId).length}
                                onChange={(e) => onToggleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className="px-6 py-3">Client</th>
                        <th className="px-6 py-3">Time in State</th>
                        <th className="px-6 py-3">Risk Level</th>
                        <th className="px-6 py-3">Submitted By</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {reviews.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic">No pending reviews. Good job!</td>
                        </tr>
                    ) : reviews.map((r) => {
                        const isSelfApproval = currentUserId === r.counselorId;
                        return (
                            <tr key={r.id} className={`hover:bg-gray-50 text-slate-800 ${r.isSlaBreach ? 'bg-orange-50/50' : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    {!isSelfApproval && (
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedIds.has(r.id)}
                                            onChange={() => onToggleSelection(r.id)}
                                        />
                                    )}
                                </td>
                                <td className="px-6 py-4 font-bold">
                                    <button
                                        onClick={() => router.push(`/clients/${r.clientId}`)}
                                        className="hover:text-indigo-600 hover:underline text-left"
                                    >
                                        {r.client}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded ${r.isSlaBreach ? 'bg-red-100 text-red-700 font-bold' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        {r.hoursPending}h
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {r.isHighRisk ? (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                            <AlertTriangle className="w-3 h-3" />
                                            HIGH RISK ({r.riskScore})
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                            <CheckCircle className="w-3 h-3" />
                                            Low Risk
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">{r.specialist}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <div className="flex justify-end items-center gap-2">
                                        <InviteToPortalButton
                                            clientId={r.clientId}
                                            clientName={r.client}
                                            clientEmail={r.email}
                                            iconOnly={true}
                                        />
                                        {isSelfApproval ? (
                                            <span className="text-xs text-slate-400 italic mr-2" title="Cannot approve own work">Conflict of Interest</span>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => router.push(`/supervisor/review-queue?id=${r.id}`)}>
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/reports/${r.clientId}`)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-slate-500 hover:text-indigo-600"
                                            title="Email Specialist"
                                            onClick={() => {
                                                const link = generateGmailLink({
                                                    to: r.email || 'specialist@agency.com',
                                                    subject: `Feedback Re: Client ${r.client}`,
                                                    body: `Hi ${r.specialist},\n\nRegarding the intake for ${r.client} submitted on ${r.date}...\n\nThanks,`
                                                });
                                                window.open(link, '_blank');
                                            }}
                                        >
                                            <Mail className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
