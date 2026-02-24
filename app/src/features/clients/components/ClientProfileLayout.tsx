"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Calendar, Edit, FileText, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface ClientProfileLayoutProps {
    client: any;
    children?: React.ReactNode;
    timelineSlot?: React.ReactNode;
    notesSlot?: React.ReactNode;
    documentsSlot?: React.ReactNode;
    appointmentsSlot?: React.ReactNode;
    assessmentsSlot?: React.ReactNode;
}

export function ClientProfileLayout({ client, timelineSlot, notesSlot, documentsSlot, appointmentsSlot, assessmentsSlot }: ClientProfileLayoutProps) {
    // Helper to get initials
    const initials = client.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="space-y-6">
            {/* 1. Face Sheet Header */}
            <Card className="p-6 border-l-4 border-l-primary shadow-sm bg-white dark:bg-slate-900">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                    {/* Identity */}
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {client.name}
                                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Active</Badge>
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {client.address || 'No address'}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> ID: {client.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Actions */}
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Phone className="w-4 h-4" /> Call
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Mail className="w-4 h-4" /> Email
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 2. Main Workspace */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start h-12 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
                    <TabsTrigger value="overview" className="gap-2 px-6">
                        <Clock className="w-4 h-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2 px-6">
                        <FileText className="w-4 h-4" /> Case Notes
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="gap-2 px-6">
                        <ShieldCheck className="w-4 h-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="gap-2 px-6">
                        <Calendar className="w-4 h-4" /> Appointments
                    </TabsTrigger>
                    <TabsTrigger value="assessments" className="gap-2 px-6">
                        <FileText className="w-4 h-4" /> Assessments
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Overview (Timeline) */}
                <TabsContent value="overview" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Timeline Column */}
                        <div className="md:col-span-2">
                            {timelineSlot}
                        </div>
                        {/* Right Sidebar: Vitals */}
                        <div className="space-y-6">
                            <Card className="p-4">
                                <h3 className="font-semibold mb-3 text-sm uppercase text-slate-500">Quick Vitals</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">SSN:</span>
                                        <span className="font-mono">***-**-{client.ssn_last_four}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Phone:</span>
                                        <span>{client.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Email:</span>
                                        <span>{client.email}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab: Case Notes */}
                <TabsContent value="notes" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    {notesSlot}
                </TabsContent>

                {/* Tab: Documents */}
                <TabsContent value="docs" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    {documentsSlot}
                </TabsContent>

                {/* Tab: Appointments */}
                <TabsContent value="appointments" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    {appointmentsSlot}
                </TabsContent>

                {/* Tab: Assessments */}
                <TabsContent value="assessments" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    {assessmentsSlot}
                </TabsContent>
            </Tabs>
        </div>
    );
}
