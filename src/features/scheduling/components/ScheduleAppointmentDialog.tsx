"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { createAppointment } from '@/app/actions/appointmentActions';

interface ScheduleAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    defaultDate?: Date;
}

export function ScheduleAppointmentDialog({ open, onOpenChange, clientId, defaultDate }: ScheduleAppointmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const formattedDefaultDate = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        try {
            const result = await createAppointment(null, formData);
            if (result.success) {
                onOpenChange(false);
                // Optional: Toast success
            } else {
                setError(result.message || 'Failed to schedule');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="client_id" value={clientId} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={formattedDefaultDate}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                name="time"
                                type="time"
                                defaultValue="09:00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            name="type"
                            required
                            defaultValue="follow_up"
                            onValueChange={(val) => {
                                if (val === 'video_call') {
                                    // Auto-generate Jitsi link
                                    const uniqueRoom = `intake-${clientId.slice(0, 8)}-${Date.now()}`;
                                    const link = `${window.location.origin}/meet/${uniqueRoom}`;
                                    // Use a ref or simple document query to set the location input if not using controlled state
                                    const locInput = document.getElementById('location') as HTMLInputElement;
                                    if (locInput) locInput.value = link;
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="intake">Initial Intake</SelectItem>
                                <SelectItem value="follow_up">Follow Up</SelectItem>
                                <SelectItem value="service_planning">Service Planning</SelectItem>
                                <SelectItem value="crisis">Crisis Intervention</SelectItem>
                                <SelectItem value="video_call">Video Call 📹</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title / Purpose</Label>
                        <Input id="title" name="title" placeholder="e.g. Weekly Check-in" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="Office / Phone / Home Visit" defaultValue="Office" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea id="notes" name="notes" placeholder="Any preparation needed?" />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Schedule
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
