"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Save, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { generateCaseNote } from '@/app/actions/generateCaseNote';
import { saveCaseNoteAction } from '@/app/actions/caseManagementActions';

// Note Type Definition
interface CaseNote {
    id: string;
    content: string;
    type: 'general' | 'clinical' | 'incident' | 'administrative';
    author: {
        username: string;
        role: string;
    };
    created_at: string;
}

interface CaseNotesFeedProps {
    notes: CaseNote[];
    clientId: string;
    currentUserId: string;
}

export function CaseNotesFeed({ notes, clientId, currentUserId }: CaseNotesFeedProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState<'general' | 'clinical' | 'incident' | 'administrative'>('clinical');
    const [error, setError] = useState('');

    const handleAIGenerate = async () => {
        if (!noteContent.trim()) return;
        setIsGenerating(true);
        setError('');
        try {
            const generated = await generateCaseNote(noteContent, noteType === 'clinical' ? 'SOAP' : 'General', 'Participant');
            setNoteContent(generated);
        } catch (err) {
            console.error(err);
            setError('Failed to generate note. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const result = await saveCaseNoteAction(null, formData);
            if (result && result.success) {
                setNoteContent('');
                setNoteType('clinical');
                // Optional: Toast success
            } else {
                setError(result?.message || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to connect to server');
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Add New Note Form */}
            <Card className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSave}>
                    <input type="hidden" name="client_id" value={clientId} />
                    <input type="hidden" name="author_id" value={currentUserId} />
                    <input type="hidden" name="type" value={noteType} />

                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Add Progress Note</h3>
                        <div className="flex gap-2">
                            <Select onValueChange={(t) => {
                                if (t === 'SOAP') setNoteContent(prev => prev + (prev ? '\n\n' : '') + "S: \nO: \nA: \nP: ");
                                if (t === 'DAP') setNoteContent(prev => prev + (prev ? '\n\n' : '') + "Data: \nAssessment: \nPlan: ");
                                if (t === 'BIRP') setNoteContent(prev => prev + (prev ? '\n\n' : '') + "Behavior: \nIntervention: \nResponse: \nPlan: ");
                            }}>
                                <SelectTrigger className="w-[140px] border-dashed">
                                    <SelectValue placeholder="+ Template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOAP">SOAP Note</SelectItem>
                                    <SelectItem value="DAP">DAP Note</SelectItem>
                                    <SelectItem value="BIRP">BIRP Note</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Note Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="clinical">Clinical</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="incident">Incident</SelectItem>
                                    <SelectItem value="administrative">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Textarea
                        name="content"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Type shorthand notes here (e.g., 'Pt arrived on time, mood anxious, discussed housing goals...'). Then click Magic Polish."
                        className="min-h-[120px] mb-3 font-mono text-sm"
                    />

                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleAIGenerate}
                            disabled={isGenerating || !noteContent.trim()}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                        >
                            <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Polishing...' : 'Magic Polish (AI)'}
                        </Button>

                        <Button type="submit" size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                            <Save className="w-4 h-4 mr-2" /> Save Note
                        </Button>
                    </div>
                </form>
            </Card>

            {/* 2. Notes Feed */}
            <div className="space-y-4">
                {notes.map((note) => (
                    <Card key={note.id} className={`p-5 ${note.type === 'incident' ? 'border-red-200 bg-red-50/10' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant={note.type === 'incident' ? 'destructive' : 'outline'}>
                                    {note.type.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-slate-500">
                                    by <span className="font-medium text-slate-900 dark:text-slate-100">{note.author?.username || 'Unknown'}</span>
                                </span>
                            </div>
                            <span className="text-xs text-slate-400">
                                {format(new Date(note.created_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300">
                            {note.type === 'incident' && <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />}
                            <p className="whitespace-pre-wrap">{note.content}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
