import { getPendingTasks, updateTaskStatus, deleteSyncTask, SyncTask } from './db';
import { IntakeService } from '@/services/IntakeService';
import { obs } from '@/services/observabilityService';

export class SyncManager {
    private static isSyncing = false;

    static async sync() {
        await this.processQueue();
    }

    static async processQueue() {
        if (this.isSyncing) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        const span = obs.startSpan('sync_manager_process_queue');
        this.isSyncing = true;

        try {
            const tasks = await getPendingTasks();
            obs.trackMetric('sync_queue_size', tasks.length);

            if (tasks.length === 0) {
                this.isSyncing = false;
                span.end();
                return;
            }

            // Instantiate service once for all tasks in this queue run
            const intakeService = new IntakeService();

            for (const task of tasks) {
                await this.processTask(task, intakeService);
            }
        } catch (error: any) {
            span.recordError(error);
            console.error('[SyncManager] Sync failed:', error);
        } finally {
            this.isSyncing = false;
            span.end();
        }
    }

    private static async processTask(task: SyncTask, intakeService: IntakeService) {
        const span = obs.startSpan(`sync_task_${task.type.toLowerCase()}`, { taskId: task.id as any });
        try {
            await updateTaskStatus(task.id, 'syncing');

            // --- CONFLICT DETECTION LOGIC ---
            if (task.type === 'INTAKE_UPDATE' || task.type === 'ASSESSMENT_UPSERT') {
                const intakeId = task.type === 'INTAKE_UPDATE' ? task.data.intakeId : task.data.intake_id;
                const serverData = await intakeService.fetchServerData(intakeId);

                if (serverData) {
                    // Simple heuristic: If server data exists and we don't know the last sync time,
                    // or if server's updated_at is later than our task's createdAt, it's a potential conflict.
                    const serverUpdatedAt = new Date(serverData.updated_at || 0).getTime();
                    if (serverUpdatedAt > task.createdAt) {
                        console.warn(`[SyncManager] Conflict detected for task ${task.id}. Server has newer data.`);
                        await updateTaskStatus(task.id, 'conflict', 'Data conflict: Server version is newer.');
                        obs.trackMetric('sync_conflict_detected', 1, { taskId: task.id });
                        span.end();
                        return;
                    }
                }
            }

            switch (task.type) {
                case 'INTAKE_CREATE':
                    await intakeService.submitNewIntake(task.data);
                    break;
                case 'INTAKE_UPDATE':
                    await intakeService.saveIntakeProgress(task.data.intakeId, task.data.data, task.data.summary);
                    break;
                case 'ASSESSMENT_UPSERT':
                    await intakeService.saveAssessment(task.data);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }

            // If successful, delete the task
            await deleteSyncTask(task.id);
            span.end();
        } catch (error: any) {
            span.recordError(error);
            console.error(`[SyncManager] Task ${task.id} failed:`, error);
            await updateTaskStatus(task.id, 'failed', error.message || 'Unknown error');
        }
    }

    static init() {
        if (typeof window === 'undefined') return;

        window.addEventListener('online', () => {
            console.log('Network back online. Triggering sync...');
            this.sync();
        });

        // Periodic sync attempt (e.g., every 5 minutes)
        setInterval(() => this.sync(), 5 * 60 * 1000);

        // Immediate sync on load if online
        this.sync();
    }
}
