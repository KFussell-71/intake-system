'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActionButton } from '@/components/ui/ActionButton';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DashboardCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Dummy events
    const events = [
        { day: 5, title: 'Team Sync', type: 'meeting' },
        { day: 12, title: 'Case Review', type: 'review' },
        { day: 12, title: 'Training', type: 'training' },
        { day: 25, title: 'Reports Due', type: 'deadline' },
    ];

    const renderCalendarDays = () => {
        const calendarDays = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        // Days
        for (let d = 1; d <= days; d++) {
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
            const dayEvents = events.filter(e => e.day === d);

            calendarDays.push(
                <div key={d} className="relative group">
                    <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                        isToday ? "bg-primary text-white hover:bg-primary hover:text-white shadow-md" : "text-slate-700 dark:text-slate-300"
                    )}>
                        {d}
                    </div>
                    {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.map((_, i) => (
                                <div key={i} className="w-1 h-1 rounded-full bg-indigo-500" />
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Schedule
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold w-24 text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4">
                <div className="grid grid-cols-7 mb-2">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2 place-items-center">
                    {renderCalendarDays()}
                </div>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Upcoming Events</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80">View All</Button>
                    </div>
                    {events.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors cursor-pointer group">
                            <div className={cn(
                                "w-1 h-8 rounded-full",
                                e.type === 'meeting' ? 'bg-blue-500' :
                                    e.type === 'review' ? 'bg-orange-500' :
                                        e.type === 'deadline' ? 'bg-red-500' : 'bg-green-500'
                            )} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{e.title}</p>
                                <p className="text-xs text-slate-500">10:00 AM - 11:00 AM</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full text-xs border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary">
                        <Plus className="w-3 h-3 mr-2" /> Add Event
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
