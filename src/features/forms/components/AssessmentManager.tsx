"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchemaForm } from './SchemaForm';
import { FORM_REGISTRY } from '../registry';
import { Card } from '@/components/ui/card';
import { Plus, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function AssessmentManager({ clientId }: { clientId: string }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<string>('');
    const [completedForms, setCompletedForms] = useState<any[]>([]); // Mock state for MVP

    const handleCreate = () => {
        setSelectedFormId('');
        setIsDialogOpen(true);
    };

    const handleSubmit = async (data: any) => {
        // In a real app, save to DB
        console.log('Form Data:', data);

        // Mock save
        const newSubmission = {
            id: Math.random().toString(),
            formId: selectedFormId,
            title: FORM_REGISTRY[selectedFormId as keyof typeof FORM_REGISTRY].title,
            date: new Date().toISOString(),
            data: data
        };

        setCompletedForms([newSubmission, ...completedForms]);
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Clinical Assessments</h3>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> New Assessment
                </Button>
            </div>

            <div className="grid gap-4">
                {completedForms.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg text-slate-500">
                        No assessments completed yet.
                    </div>
                ) : (
                    completedForms.map((form) => (
                        <Card key={form.id} className="p-4 flex justify-between items-center">
                            <div className="flex item-center gap-3">
                                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{form.title}</h4>
                                    <p className="text-sm text-slate-500">
                                        Completed on {format(new Date(form.date), 'PPP')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">View</Button>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {!selectedFormId ? (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Select Assessment Type</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.values(FORM_REGISTRY).map((schema) => (
                                    <Button
                                        key={schema.id}
                                        variant="outline"
                                        className="justify-start h-auto p-4 text-left"
                                        onClick={() => setSelectedFormId(schema.id)}
                                    >
                                        <FileText className="w-5 h-5 mr-3 text-slate-500" />
                                        <div>
                                            <div className="font-semibold">{schema.title}</div>
                                            <div className="text-xs text-slate-500">{schema.description}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <SchemaForm
                            schema={FORM_REGISTRY[selectedFormId as keyof typeof FORM_REGISTRY]}
                            onSubmit={handleSubmit}
                            onCancel={() => setSelectedFormId('')}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
