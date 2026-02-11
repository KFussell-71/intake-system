'use client';

import { useState, useEffect } from 'react';
import { intakeController } from '@/controllers/IntakeController';

export function useIntakeConflicts(intakeId: string | null, setFormData: (data: any) => void) {
    const [conflictTask, setConflictTask] = useState<any>(null);
    const [serverDataForConflict, setServerDataForConflict] = useState<any>(null);

    useEffect(() => {
        const checkConflicts = async () => {
            if (!intakeId) return;
            const { getDB } = await import('@/lib/offline/db');
            const db = await getDB();
            if (!db) return;

            const conflicts = await db.getAllFromIndex('sync-queue', 'by-status', 'conflict');
            const myConflict = conflicts.find(c => c.data.intakeId === intakeId || c.data.intake_id === intakeId);

            if (myConflict) {
                const sData = await intakeController.fetchServerData(intakeId);
                setConflictTask(myConflict);
                setServerDataForConflict(sData);
            }
        };

        const interval = setInterval(checkConflicts, 10000);
        checkConflicts();
        return () => clearInterval(interval);
    }, [intakeId]);

    const handleResolveConflict = async (resolvedData: any) => {
        if (!conflictTask || !intakeId) return;

        const { deleteSyncTask } = await import('@/lib/offline/db');
        await deleteSyncTask(conflictTask.id);

        setFormData(resolvedData);
        setConflictTask(null);
        setServerDataForConflict(null);

        await intakeController.saveIntakeProgress(intakeId, resolvedData, "Resolved Sync Conflict");
    };

    return {
        conflictTask,
        serverDataForConflict,
        handleResolveConflict
    };
}
