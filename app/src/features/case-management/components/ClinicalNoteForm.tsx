'use client';

import { useState, useEffect } from 'react';
import { ClinicalNotePurpose, ClinicalTemplateType, ClinicalNoteFormData, ClinicalNote } from '@/types/clinical_note';
import { clinicalNoteService } from '@/services/ClinicalNoteService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { toast } from 'sonner';
import { FileText, Save, CheckCircle2, History, ClipboardCheck } from 'lucide-react';

interface Props {
    clientId: string;
    existingNote?: ClinicalNote;
    onSaved?: (note: ClinicalNote) => void;
}

export function ClinicalNoteForm({ clientId, existingNote, onSaved }: Props) {
    const [purpose, setPurpose] = useState<ClinicalNotePurpose>(existingNote?.purpose || 'routine_follow_up');
    const [templateType, setTemplateType] = useState<ClinicalTemplateType>(existingNote?.template_type || 'SOAP');
    const [formData, setFormData] = useState<Partial<ClinicalNoteFormData>>(existingNote || {});
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);

    const handleSave = async (isFinal: boolean = false) => {
        if (isFinal && !signature) {
            toast.error('Signature is required to finalize');
            return;
        }

        setIsSaving(true);
        try {
            let result: ClinicalNote;
            const fullData: ClinicalNoteFormData = {
                purpose,
                template_type: templateType,
                ...formData
            } as any;

            if (existingNote?.id) {
                result = await clinicalNoteService.updateNote(existingNote.id, fullData);
            } else {
                result = await clinicalNoteService.createNote(clientId, fullData);
            }

            if (isFinal && signature) {
                result = await clinicalNoteService.finalizeNote(result.id, signature);
                toast.success('Note finalized and locked');
            } else {
                toast.success('Draft saved successfully');
            }

            if (onSaved) onSaved(result);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const renderSoapFields = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Subjective</label>
                <Textarea
                    value={formData.subjective || ''}
                    onChange={e => setFormData(prev => ({ ...prev, subjective: e.target.value }))}
                    placeholder="Client's report, feelings, and perceptions..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Objective</label>
                <Textarea
                    value={formData.objective || ''}
                    onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Observable, measurable data and facts..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Assessment</label>
                <Textarea
                    value={formData.assessment || ''}
                    onChange={e => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
                    placeholder="Clinician's interpretation/analysis..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Plan</label>
                <Textarea
                    value={formData.plan || ''}
                    onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    placeholder="Interventions, follow-up, and next steps..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
        </div>
    );

    const renderDapFields = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data</label>
                <Textarea
                    value={formData.data_narrative || ''}
                    onChange={e => setFormData(prev => ({ ...prev, data_narrative: e.target.value }))}
                    placeholder="Observations, client report, and narrative..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[150px]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Assessment</label>
                <Textarea
                    value={formData.assessment_narrative || ''}
                    onChange={e => setFormData(prev => ({ ...prev, assessment_narrative: e.target.value }))}
                    placeholder="Interpretation and clinical reasoning..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Plan</label>
                <Textarea
                    value={formData.plan_narrative || ''}
                    onChange={e => setFormData(prev => ({ ...prev, plan_narrative: e.target.value }))}
                    placeholder="Next steps and interventions..."
                    disabled={existingNote?.is_finalized}
                    className="min-h-[100px]"
                />
            </div>
        </div>
    );

    return (
        <GlassCard className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">
                        {existingNote?.is_finalized ? 'Finalized Clinical Note' : 'New Clinical Note'}
                    </h2>
                </div>

                {!existingNote?.is_finalized && (
                    <div className="flex items-center gap-3">
                        <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="initial_assessment">Initial Assessment</SelectItem>
                                <SelectItem value="routine_follow_up">Routine Follow-up</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={templateType} onValueChange={(v: any) => setTemplateType(v)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SOAP">SOAP</SelectItem>
                                <SelectItem value="DAP">DAP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {purpose === 'initial_assessment' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                    <ClipboardCheck className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-bold">Initial Assessment Mode</p>
                        <p>Please ensure you cover Chief Complaint, Patient History, and Initial Treatment Goals in the corresponding sections below.</p>
                    </div>
                </div>
            )}

            {templateType === 'SOAP' ? renderSoapFields() : renderDapFields()}

            {!existingNote?.is_finalized && (
                <div className="space-y-6 pt-6 border-t font-medium">
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                        <History className="w-4 h-4" />
                        Finalization & Signature
                    </div>

                    <SignaturePad
                        onSignatureChange={(sig: string | null) => setSignature(sig)}
                    />

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !signature}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Finalize Note
                        </Button>
                    </div>
                </div>
            )}

            {existingNote?.is_finalized && (
                <div className="pt-6 border-t mt-6">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Finalized Signature</p>
                    <div className="border rounded-lg p-2 inline-block bg-slate-50">
                        <img src={existingNote.signature!} alt="Signature" className="h-16" />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                        Finalized by {existingNote.author?.first_name} {existingNote.author?.last_name} on {new Date(existingNote.finalized_at!).toLocaleString()}
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
