'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { XCircle, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReturnForRevisionDialogProps {
    open: boolean;
    onClose: () => void;
    intakeId: string;
    clientName: string;
    onReturnComplete?: () => void;
}

const REVISION_REASONS = [
    'Missing information',
    'Incorrect data',
    'Needs clarification',
    'Quality issues',
    'Incomplete employment history',
    'Missing documentation',
    'Goals need refinement',
    'Other'
];

export const ReturnForRevisionDialog: React.FC<ReturnForRevisionDialogProps> = ({
    open,
    onClose,
    intakeId,
    clientName,
    onReturnComplete
}) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [urgent, setUrgent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReturn = async () => {
        if (!reason) {
            setError('Please select a reason');
            return;
        }

        if (!notes.trim()) {
            setError('Please provide detailed feedback');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/supervisor/return-for-revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intakeId,
                    reason,
                    notes,
                    urgent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to return report');
            }

            setSuccess(true);
            setTimeout(() => {
                onReturnComplete?.();
                handleClose();
            }, 1500);

        } catch (err: any) {
            console.error('Error returning report:', err);
            setError(err.message || 'Failed to return report for revision');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setNotes('');
        setUrgent(false);
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-orange-600" />
                        Return Report for Revision
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Client: <span className="font-semibold">{clientName}</span>
                    </p>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                        <p className="text-lg font-semibold text-slate-900">Report Returned</p>
                        <p className="text-sm text-slate-500 mt-1">
                            The specialist will be notified to make revisions
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Warning Banner */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-orange-900">
                                    This will send the report back to the specialist
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                    Please provide clear, actionable feedback to help them improve the report.
                                </p>
                            </div>
                        </div>

                        {/* Reason Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Reason for Return *
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="">Select a reason...</option>
                                {REVISION_REASONS.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Detailed Feedback */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Detailed Feedback *
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Explain what needs to be corrected or improved. Be specific and provide examples where possible..."
                                rows={5}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {notes.length} characters
                            </p>
                        </div>

                        {/* Urgent Checkbox */}
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="urgent"
                                checked={urgent}
                                onChange={(e) => setUrgent(e.target.checked)}
                                className="w-4 h-4 mt-0.5 text-orange-600 focus:ring-orange-500 rounded"
                            />
                            <label htmlFor="urgent" className="text-sm text-slate-700 cursor-pointer">
                                <span className="font-medium">Mark as urgent</span>
                                <span className="block text-xs text-slate-500 mt-0.5">
                                    Specialist will be notified immediately
                                </span>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                {!success && (
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <ActionButton
                            onClick={handleReturn}
                            disabled={submitting || !reason || !notes.trim()}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        >
                            {submitting ? 'Returning...' : 'Return for Revision'}
                        </ActionButton>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
