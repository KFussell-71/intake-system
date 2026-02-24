"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar'; // Our new component
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, MapPin, XCircle } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ScheduleAppointmentDialog } from './ScheduleAppointmentDialog';

interface Appointment {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    type: string;
    status: string;
    location?: string;
    notes?: string;
}

interface AppointmentCalendarProps {
    appointments: Appointment[];
    clientId: string;
}

export function AppointmentCalendar({ appointments, clientId }: AppointmentCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter appointments for the selected day
    const dayAppointments = appointments.filter(apt =>
        date && isSameDay(parseISO(apt.start_time), date)
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Modifiers for the calendar (days with appointments)
    const appointmentDays = appointments.map(a => parseISO(a.start_time));

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Calendar & Dialog Trigger */}
            <div className="md:col-span-4 space-y-6">
                <Card className="p-4 flex flex-col items-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        modifiers={{ hasAppointment: appointmentDays }}
                        modifiersStyles={{
                            hasAppointment: {
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                color: 'var(--primary)'
                            }
                        }}
                        className="rounded-md border"
                    />
                    <div className="w-full mt-4">
                        <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Schedule Appointment
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right: Agenda for Selected Day */}
            <div className="md:col-span-8">
                <div className="mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        {date ? format(date, 'EEEE, MMMM do, yyyy') : 'Select a date'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled
                    </p>
                </div>

                <div className="space-y-4">
                    {dayAppointments.length === 0 ? (
                        <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                            No appointments on this day.
                        </div>
                    ) : (
                        dayAppointments.map(apt => (
                            <Card key={apt.id} className="p-4 flex justify-between items-start hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={apt.status === 'cancelled' ? 'destructive' : 'outline'}>
                                            {apt.type.toUpperCase().replace('_', ' ')}
                                        </Badge>
                                        <span className="text-slate-500 text-sm font-mono">
                                            {format(parseISO(apt.start_time), 'h:mm a')} - {format(parseISO(apt.end_time), 'h:mm a')}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-semibold">{apt.title}</h4>
                                    {apt.location && (
                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {apt.location}
                                        </p>
                                    )}
                                    {apt.notes && (
                                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                                            {apt.notes}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    {apt.status !== 'cancelled' && (
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <ScheduleAppointmentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                clientId={clientId}
                defaultDate={date}
            />
        </div>
    );
}
