import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncTask {
    id: string;
    type: 'INTAKE_CREATE' | 'INTAKE_UPDATE' | 'ASSESSMENT_UPSERT';
    data: any;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
    attempts: number;
    createdAt: number;
    updatedAt: number;
}

interface IntakeDraft {
    id: string;
    data: any;
    updatedAt: number;
}

interface IntakeDB extends DBSchema {
    'sync-queue': {
        key: string;
        value: SyncTask;
        indexes: { 'by-status': string; 'by-created': number };
    };
    'intake-drafts': {
        key: string;
        value: IntakeDraft;
    };
}

const DB_NAME = 'intake-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IntakeDB>> | null = null;

export const getDB = () => {
    if (typeof window === 'undefined') return null;

    if (!dbPromise) {
        dbPromise = openDB<IntakeDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
                syncStore.createIndex('by-status', 'status');
                syncStore.createIndex('by-created', 'createdAt');

                db.createObjectStore('intake-drafts', { keyPath: 'id' });
            },
        });
    }
    return dbPromise;
};

export const saveSyncTask = async (task: Omit<SyncTask, 'id' | 'status' | 'attempts' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDB();
    if (!db) return null;

    const newTask: SyncTask = {
        ...task,
        id: crypto.randomUUID(),
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await db.put('sync-queue', newTask);
    return newTask;
};

export const getPendingTasks = async () => {
    const db = await getDB();
    if (!db) return [];
    return db.getAllFromIndex('sync-queue', 'by-status', 'pending');
};

export const updateTaskStatus = async (id: string, status: SyncTask['status'], error?: string) => {
    const db = await getDB();
    if (!db) return;

    const task = await db.get('sync-queue', id);
    if (!task) return;

    task.status = status;
    task.error = error;
    task.updatedAt = Date.now();
    if (status === 'failed') {
        task.attempts += 1;
    }

    await db.put('sync-queue', task);
};

export const deleteSyncTask = async (id: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete('sync-queue', id);
};

export const saveDraft = async (id: string, data: any) => {
    const db = await getDB();
    if (!db) return;
    await db.put('intake-drafts', { id, data, updatedAt: Date.now() });
};

export const getDraft = async (id: string) => {
    const db = await getDB();
    if (!db) return null;
    return db.get('intake-drafts', id);
};
