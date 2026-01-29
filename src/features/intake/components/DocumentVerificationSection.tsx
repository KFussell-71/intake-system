import React from 'react';
import { FileCheck, Calendar, Upload, CheckCircle2 } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { IntakeFormData } from '../types/intake';
import { ActionButton } from '@/components/ui/ActionButton';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    // Optional: Pass clientId if available to enable uploads immediately
    clientId?: string;
}

export const DocumentVerificationSection: React.FC<Props> = ({ formData, onChange, clientId }) => {

    // Helper to render a verification card
    const renderVerificationItem = (
        title: string,
        dateField: keyof IntakeFormData,
        notesField: keyof IntakeFormData,
        hasDoc: boolean = false
    ) => {
        const isReviewed = !!formData[dateField];

        return (
            <GlassCard className={`p-4 border border-white/20 transition-all ${isReviewed ? 'bg-green-500/5 border-green-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isReviewed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                            {isReviewed ? <CheckCircle2 className="w-5 h-5" /> : <FileCheck className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <ElegantInput
                        label="Date Reviewed"
                        name={dateField}
                        value={formData[dateField] as string}
                        onChange={onChange}
                        type="date"
                        icon={<Calendar className="w-4 h-4" />}
                        className="text-sm"
                    />

                    <ElegantTextarea
                        label="Notes / Observations"
                        name={notesField}
                        value={formData[notesField] as string}
                        onChange={onChange}
                        placeholder="Add details..."
                        className="text-sm min-h-[80px]"
                        enableDictation
                    />

                    <div className="flex gap-2">
                        <ActionButton
                            size="sm"
                            variant={hasDoc ? "primary" : "secondary"}
                            className="w-full text-xs"
                            icon={hasDoc ? <CheckCircle2 className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                            onClick={() => {
                                // Mock upload for now - in production would trigger file picker
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.onchange = () => {
                                    alert(`File uploaded for ${title}!\n(Mock storage integration)`);
                                };
                                input.click();
                            }}
                        >
                            {hasDoc ? "Document Uploaded" : "Upload Document"}
                        </ActionButton>
                    </div>
                </div>
            </GlassCard>
        );
    };

    return (
        <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-white">
                <FileCheck className="w-5 h-5 text-primary" />
                Document Review & Verification
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Verify that the following required documents have been received and reviewed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderVerificationItem('Referral Form', 'referralReviewDate', 'referralNotes')}
                {renderVerificationItem('Authorization', 'authReviewDate', 'authNotes')}
                {renderVerificationItem('Work History', 'workHistoryReviewDate', 'workHistoryNotes')}
            </div>
        </div>
    );
};
