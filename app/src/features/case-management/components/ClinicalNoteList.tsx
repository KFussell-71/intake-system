'use client';

import { ClinicalNote } from '@/types/clinical_note';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Lock, Clock } from 'lucide-react';

interface Props {
    notes: ClinicalNote[];
    onSelect?: (note: ClinicalNote) => void;
}

export function ClinicalNoteList({ notes, onSelect }: Props) {
    if (notes.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-500 font-medium">No clinical notes recorded yet</h3>
                <p className="text-slate-400 text-sm">Start by creating an initial assessment or follow-up note.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notes.map((note) => (
                <GlassCard
                    key={note.id}
                    className={`p-5 cursor-pointer hover:border-indigo-300 transition-colors border-l-4 ${note.is_finalized ? 'border-l-indigo-500' : 'border-l-amber-400'
                        }`}
                    onClick={() => onSelect?.(note)}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 capitalize">
                                    {note.purpose.replace('_', ' ')}
                                </h4>
                                <Badge variant={note.template_type === 'SOAP' ? 'default' : 'secondary'}>
                                    {note.template_type}
                                </Badge>
                                {note.is_finalized ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                                        <Lock className="w-3 h-3 mr-1" />
                                        Finalized
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Draft
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(note.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {note.author?.first_name} {note.author?.last_name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 italic">
                        {note.template_type === 'SOAP' ? note.assessment : note.assessment_narrative}
                    </p>
                </GlassCard>
            ))}
        </div>
    );
}
