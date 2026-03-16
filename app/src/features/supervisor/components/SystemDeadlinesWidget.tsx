'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { generateGoogleCalendarLink } from '@/lib/googleUtils';

export function SystemDeadlinesWidget() {
    // Mock system events (In real app, fetch from DB)
    const upcomingDeadlines = [
        {
            id: 1,
            title: "Intake Review: John Doe",
            date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
            type: "Review"
        },
        {
            id: 2,
            title: "Reports Due: Batch #104",
            date: new Date(new Date().setDate(new Date().getDate() + 3)),
            type: "Deadline"
        },
        {
            id: 3,
            title: "Staff Training: Compliance",
            date: new Date(new Date().setDate(new Date().getDate() + 5)),
            type: "Meeting"
        }
    ];

    const handleAddToCalendar = (event: any) => {
        const link = generateGoogleCalendarLink({
            title: event.title,
            details: `System Event ID: ${event.id}\nType: ${event.type}\nPlease complete this task by the deadline.`,
            start: event.date
        });
        window.open(link, '_blank');
    };

    return (
        <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    System Deadlines
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingDeadlines.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => handleAddToCalendar(item)}
                                    title="Add to Google Calendar"
                                >
                                    <CalendarPlus className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate">
                                {item.title}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${item.type === 'Review' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        item.type === 'Deadline' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {item.type}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 h-7">
                    View All Deadlines <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </Card>
    );
}
