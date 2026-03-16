import React, { useState, useEffect } from 'react';
import { intakeController } from '@/controllers/IntakeController';
import { IntakeAssessment } from '@/services/IntakeService';
import { Shield, CheckCircle, AlertTriangle, FileText, Save, Wand2, X } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';
import { CLINICAL_SNIPPETS } from '@/config/clinical_snippets';

interface Props {
    intakeId: string;
    clientData: any; // Read-only view of what client submitted
}

export function CounselorAssessmentPanel({ intakeId, clientData }: Props) {
    const [assessment, setAssessment] = useState<Partial<IntakeAssessment>>({
        verified_barriers: [],
        clinical_narrative: '',
        recommended_priority_level: 2,
        eligibility_status: 'pending',
        eligibility_rationale: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Snippet System
    const [activeSnippetField, setActiveSnippetField] = useState<'clinical_narrative' | 'eligibility_rationale' | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await intakeController.getAssessment(intakeId);
            if (data) {
                setAssessment(data);
            }
            setLoading(false);
        };
        if (intakeId) load();
    }, [intakeId]);

    const handleSave = async () => {
        setSaving(true);
        await intakeController.saveAssessment({
            ...assessment,
            intake_id: intakeId
        });
        setSaving(false);
    };

    const insertSnippet = (text: string) => {
        if (!activeSnippetField) return;
        setAssessment(prev => ({
            ...prev,
            [activeSnippetField]: (prev[activeSnippetField] || '') + (prev[activeSnippetField] ? ' ' : '') + text
        }));
        setActiveSnippetField(null);
    };

    if (loading) return <div className="p-4 animate-pulse">Loading Clinical Data...</div>;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col relative">

            {/* Snippet Modal Overlay */}
            {activeSnippetField && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-50 flex flex-col p-6 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-indigo-600 flex items-center gap-2">
                            <Wand2 className="w-5 h-5" />
                            Select a Snippet
                        </h3>
                        <button onClick={() => setActiveSnippetField(null)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6">
                        {Object.entries(CLINICAL_SNIPPETS).map(([category, snippets]) => (
                            <div key={category}>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{category}</h4>
                                <div className="grid gap-2">
                                    {snippets.map((snippet, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => insertSnippet(snippet.text)}
                                            className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                        >
                                            <div className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">
                                                {snippet.label}
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-2">
                                                {snippet.text}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-5 h-5" />
                    <h2 className="font-bold text-lg">Clinical Assessment</h2>
                </div>
                <p className="text-xs text-slate-500">
                    Proprietary record. Not visible to client.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* 1. Barrier Verification */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Barrier Verification
                    </h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                        <p className="text-sm text-slate-500 mb-2">Check barriers you have verified with documentation.</p>
                        {clientData.barriers?.map((barrier: string) => (
                            <label key={barrier} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={assessment.verified_barriers?.includes(barrier)}
                                    onChange={(e) => {
                                        const current = assessment.verified_barriers || [];
                                        const next = e.target.checked
                                            ? [...current, barrier]
                                            : current.filter(b => b !== barrier);
                                        setAssessment(prev => ({ ...prev, verified_barriers: next }));
                                    }}
                                />
                                <span className="text-sm font-medium">{barrier}</span>
                            </label>
                        ))}
                        {(!clientData.barriers || clientData.barriers.length === 0) && (
                            <div className="text-sm text-slate-400 italic">No barriers reported by client.</div>
                        )}
                    </div>
                </section>

                {/* 2. Clinical Narrative */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Clinical Narrative
                        </h3>
                        <button
                            onClick={() => setActiveSnippetField('clinical_narrative')}
                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 bg-indigo-50 rounded-md transition-colors"
                        >
                            <Wand2 className="w-3 h-3" />
                            Snippets
                        </button>
                    </div>
                    <textarea
                        className="w-full h-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter your professional observations, behavioral notes, and case formulation..."
                        value={assessment.clinical_narrative || ''}
                        onChange={e => setAssessment(prev => ({ ...prev, clinical_narrative: e.target.value }))}
                    />
                </section>

                {/* 3. Eligibility Determination */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Eligibility Determination
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {['pending', 'eligible', 'ineligible'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setAssessment(prev => ({ ...prev, eligibility_status: status as any }))}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${assessment.eligibility_status === status
                                            ? (status === 'eligible' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                status === 'ineligible' ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                    'bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400')
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setActiveSnippetField('eligibility_rationale')}
                                className="absolute top-2 right-2 text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                title="Insert Snippet"
                            >
                                <Wand2 className="w-4 h-4" />
                            </button>
                            <textarea
                                className="w-full h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                placeholder="Rationale for determination (Required for audit defense)..."
                                value={assessment.eligibility_rationale || ''}
                                onChange={e => setAssessment(prev => ({ ...prev, eligibility_rationale: e.target.value }))}
                            />
                        </div>
                    </div>
                </section>

            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
                <ActionButton
                    onClick={handleSave}
                    isLoading={saving}
                    icon={<Save className="w-4 h-4" />}
                    className="w-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                >
                    Save Clinical Record
                </ActionButton>
            </div>
        </div>
    );
}
