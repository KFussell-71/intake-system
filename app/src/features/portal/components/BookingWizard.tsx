'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar'; // Ensure this exists or use native date picker
import { format } from 'date-fns';
import { Loader2, Video, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getAvailableSlots, bookClientAppointment } from '@/actions/portal/bookingActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function BookingWizard({ clientId }: { clientId: string }) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [type, setType] = useState<'video_call' | 'in_person'>('video_call');
    const [slots, setSlots] = useState<{ start: Date, available: boolean }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (date && step === 2) {
            fetchSlots();
        }
    }, [date, step]);

    async function fetchSlots() {
        if (!date) return;
        setLoadingSlots(true);
        const res = await getAvailableSlots(format(date, 'yyyy-MM-dd'), clientId);
        if (res.success && res.data) {
            setSlots(res.data);
            if (res.staffId) setStaffId(res.staffId);
        } else {
            toast.error('Could not load slots');
        }
        setLoadingSlots(false);
    }

    async function handleConfirm() {
        if (!date || !selectedSlot) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('client_id', clientId);
        formData.append('date', format(date, 'yyyy-MM-dd'));
        formData.append('time', format(selectedSlot, 'HH:mm')); // Extract time
        formData.append('type', type);
        formData.append('title', type === 'video_call' ? 'Video Check-in' : 'Office Visit');
        formData.append('location', type === 'video_call' ? 'Online' : 'Office');
        formData.append('notes', 'Self-scheduled via Portal');

        // If staffId was returned, we should probably assign them, but createAppointment 
        // logic might auto-assign based on login (which is client here) or 
        // require a staff ID. 
        // NOTE: createAppointment currently expects 'assigned_to' or picks a default? 
        // Let's assume standard logic handles it, or we need to pass staff_id.
        if (staffId) formData.append('staff_id', staffId);


        const res = await bookClientAppointment(formData);

        if (res.success) {
            toast.success('Appointment Confirmed!');
            router.push('/portal');
        } else {
            toast.error(res.message || 'Booking failed');
        }
        setIsSubmitting(false);
    }

    // --- Steps ---

    const renderTypeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => { setType('video_call'); setStep(2); }}
                className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/10",
                    type === 'video_call' ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 bg-white"
                )}
            >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                    <Video className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">Video Call</h3>
                <p className="text-sm text-slate-500 mt-1">Meet securely from home via Jitsi.</p>
            </button>

            <button
                onClick={() => { setType('in_person'); setStep(2); }}
                className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all hover:border-blue-500 hover:bg-blue-50/10",
                    type === 'in_person' ? "border-blue-500 bg-blue-50/10" : "border-slate-200 bg-white"
                )}
            >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                    <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">In-Person Visit</h3>
                <p className="text-sm text-slate-500 mt-1">Come to our office for a face-to-face meeting.</p>
            </button>
        </div>
    );

    const renderDateSlotSelection = () => (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Pick a Date
                </h3>
                {/* Using standard input as Calendar component might need setup */}
                <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
            </div>

            <div className="md:w-1/2">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Available Slots
                </h3>
                {loadingSlots ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {slots.map((slot, i) => (
                            <button
                                key={i}
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.start)}
                                className={cn(
                                    "px-2 py-3 rounded text-sm text-center transition-colors border",
                                    !slot.available && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent",
                                    slot.available && selectedSlot?.getTime() === slot.start.getTime()
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white hover:border-slate-400 border-slate-200"
                                )}
                            >
                                {format(new Date(slot.start), 'h:mm a')}
                            </button>
                        ))}
                        {slots.length === 0 && <p className="col-span-3 text-center text-slate-500 text-sm">No slots available.</p>}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between px-10">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col items-center relative z-10">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                            step >= s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
                        )}>
                            {s}
                        </div>
                        <span className="text-xs mt-2 text-slate-500 font-medium">
                            {s === 1 ? 'Type' : s === 2 ? 'Time' : 'Confirm'}
                        </span>
                    </div>
                ))}
                {/* Line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-0 hidden"></div>
            </div>

            <Card className="p-6 min-h-[400px]">
                {step === 1 && renderTypeSelection()}

                {step === 2 && (
                    <div className="space-y-6">
                        {renderDateSlotSelection()}
                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setStep(1)} className="mr-2">Back</Button>
                            <Button
                                disabled={!selectedSlot}
                                onClick={() => setStep(3)}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-md mx-auto text-center space-y-6 pt-8">
                        <h2 className="text-2xl font-bold">Confirm Booking</h2>
                        <div className="bg-slate-50 p-6 rounded-xl space-y-4 text-left">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Service</span>
                                <span className="font-semibold">{type === 'video_call' ? 'Video Check-in' : 'In-Person Visit'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date</span>
                                <span className="font-semibold">{date && format(date, 'MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Time</span>
                                <span className="font-semibold">{selectedSlot && format(selectedSlot, 'h:mm a')}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => setStep(2)}>Change</Button>
                            <Button onClick={handleConfirm} disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
