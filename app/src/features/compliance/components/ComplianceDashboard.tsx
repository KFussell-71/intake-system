'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, FileCheck, Calendar } from 'lucide-react';

export const ComplianceDashboard: React.FC = () => {
    // Mock data - in real app fetch from 'compliance_scans'
    const scanResults = {
        lastRun: '2026-01-29 08:00 AM',
        missingDocs: 5,
        overdueFollowUps: 3,
        ispGoalsNoTimeline: 2,
        score: 94
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">System Compliance Overview</h2>
                    <p className="text-sm text-gray-500">Automated Quarterly Scan Results (Current Period)</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-semibold text-gray-600 block">Overall Compliance Score</span>
                    <span className={`text-3xl font-bold ${scanResults.score >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {scanResults.score}%
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Missing Required Documents</CardTitle>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scanResults.missingDocs}</div>
                        <p className="text-xs text-gray-500 mt-1">Files flagged for review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Overdue Follow-ups</CardTitle>
                        <Calendar className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scanResults.overdueFollowUps}</div>
                        <p className="text-xs text-gray-500 mt-1">Client contacts missed &gt; 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">ISP Goals (No Timeline)</CardTitle>
                        <FileCheck className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scanResults.ispGoalsNoTimeline}</div>
                        <p className="text-xs text-gray-500 mt-1">Goals missing target dates</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="font-bold text-red-800 flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Critical Issues Required Action
                </h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>3 Clients missing intake signature within 45 days.</li>
                    <li>2 Reports generated without Authorization verification (Overridden).</li>
                    <li>5 Employment history records with gap &gt; 6 months unexplained.</li>
                </ul>
            </div>
        </div>
    );
};
