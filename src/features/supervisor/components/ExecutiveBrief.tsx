"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Download, Copy, FileText, Loader2 } from 'lucide-react';
import { generateExecutiveReport } from '@/app/actions/generateExecutiveReport';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export function ExecutiveBrief() {
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastMetrics, setLastMetrics] = useState<any>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generateExecutiveReport({ lookbackDays: 7 });
            if (result.success && result.report) {
                setReport(result.report);
                setLastMetrics(result.metrics);
                toast.success("Executive Brief generated successfully");
            } else {
                toast.error("Failed to generate brief");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error connecting to AI service");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (report) {
            navigator.clipboard.writeText(report);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <Card className="col-span-full bg-slate-50 dark:bg-slate-900 border-indigo-100 dark:border-indigo-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Executive Brief (AI)
                </CardTitle>
                <div className="flex gap-2">
                    {!report && (
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Strategy...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" /> Generate Board Report
                                </>
                            )}
                        </Button>
                    )}
                    {report && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                <Copy className="h-4 w-4 mr-2" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setReport(null)}>
                                Reset
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!report && !isLoading && (
                    <div className="text-center py-8 text-slate-500">
                        <p>Click generic to transform this week's data into a strategy narrative.</p>
                        <p className="text-xs mt-2 opacity-70">Powered by Ollama / Gemini Dual-Engine</p>
                    </div>
                )}

                {isLoading && (
                    <div className="space-y-4 py-4 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                )}

                {report && (
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white dark:bg-slate-950 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
