'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { getWorkerList } from '@/lib/supervisor/supervisorCore';
import { getClientAssignment } from '@/lib/supervisor/supervisorAssignments';

interface WorkerAssignmentDialogProps {
    open: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    onAssignmentComplete?: () => void;
}

export const WorkerAssignmentDialog: React.FC<WorkerAssignmentDialogProps> = ({
    open,
    onClose,
    clientId,
    clientName,
    onAssignmentComplete
}) => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [currentAssignment, setCurrentAssignment] = useState<any>(null);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [assignmentType, setAssignmentType] = useState<'primary' | 'secondary'>('primary');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, clientId]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            // Load workers
            const workersResult = await getWorkerList();
            if (workersResult.error) {
                setError('Failed to load workers');
            } else {
                setWorkers(workersResult.data);
            }

            // Load current assignment
            const assignmentResult = await getClientAssignment(clientId);
            if (assignmentResult.data) {
                setCurrentAssignment(assignmentResult.data);
                setSelectedWorker(assignmentResult.data.assigned_worker_id);
                setAssignmentType(assignmentResult.data.assignment_type);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load assignment data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedWorker) {
            setError('Please select a worker');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/supervisor/assign-worker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    workerId: selectedWorker,
                    assignmentType,
                    notes
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to assign worker');
            }

            setSuccess(true);
            setTimeout(() => {
                onAssignmentComplete?.();
                handleClose();
            }, 1500);

        } catch (err: any) {
            console.error('Error assigning worker:', err);
            setError(err.message || 'Failed to assign worker');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedWorker('');
        setAssignmentType('primary');
        setNotes('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Assign Employment Specialist
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Client: <span className="font-semibold">{clientName}</span>
                    </p>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                        <p className="text-lg font-semibold text-slate-900">Assignment Successful!</p>
                        <p className="text-sm text-slate-500 mt-1">Worker has been assigned to this client</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Current Assignment */}
                        {currentAssignment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                                    Current Assignment
                                </p>
                                <p className="text-sm text-blue-900">
                                    {currentAssignment.worker?.username} ({currentAssignment.assignment_type})
                                </p>
                                {currentAssignment.notes && (
                                    <p className="text-xs text-blue-700 mt-1">{currentAssignment.notes}</p>
                                )}
                            </div>
                        )}

                        {/* Worker Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Employment Specialist *
                            </label>
                            <select
                                value={selectedWorker}
                                onChange={(e) => setSelectedWorker(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="">Select a specialist...</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.username} ({worker.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignment Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Assignment Type *
                            </label>
                            <div className="flex gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="primary"
                                        checked={assignmentType === 'primary'}
                                        onChange={(e) => setAssignmentType(e.target.value as 'primary')}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-slate-700">Primary</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="secondary"
                                        checked={assignmentType === 'secondary'}
                                        onChange={(e) => setAssignmentType(e.target.value as 'secondary')}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-slate-700">Secondary</span>
                                </label>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Assignment Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any relevant notes about this assignment..."
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !success && (
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <ActionButton
                            onClick={handleAssign}
                            disabled={submitting || !selectedWorker}
                            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        >
                            {submitting ? 'Assigning...' : currentAssignment ? 'Reassign' : 'Assign'}
                        </ActionButton>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
