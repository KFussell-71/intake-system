import { useEffect, useState } from 'react';
import { saveDraft, getDraft } from '@/lib/offline/db';
import { toast } from 'sonner';

export function useOfflineDraft(formId: string, currentData: any, isDirty: boolean) {
    const [hasRestored, setHasRestored] = useState(false);

    // Auto-save draft when data changes
    useEffect(() => {
        if (!isDirty || !formId) return;

        const timer = setTimeout(async () => {
            try {
                await saveDraft(formId, currentData);
                // Optional: Console log for debug, but don't spam toasts
                console.log('[Drafts] Saved offline draft for', formId);
            } catch (error) {
                console.error('[Drafts] Failed to save draft', error);
            }
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [formId, currentData, isDirty]);

    // Check for draft on mount
    const checkDraft = async () => {
        try {
            const draft = await getDraft(formId);
            if (draft && draft.data) {
                return draft.data;
            }
        } catch (error) {
            console.error('[Drafts] Failed to load draft', error);
        }
        return null;
    };

    return { checkDraft };
}
