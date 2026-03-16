import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncTask {
    id: string;
    type: 'INTAKE_CREATE' | 'INTAKE_UPDATE' | 'ASSESSMENT_UPSERT';
    data: any;
    status: 'pending' | 'syncing' | 'failed' | 'conflict';
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

interface IntakeBackup {
    id: string;
    formId: string;
    data: any;
    createdAt: number;
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
    'intake-backups': {
        key: string;
        value: IntakeBackup;
        indexes: { 'by-form': string; 'by-date': number };
    };
}

const DB_NAME = 'intake-offline-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<IntakeDB>> | null = null;

export const getDB = () => {
    if (typeof window === 'undefined') return null;

    if (!dbPromise) {
        dbPromise = openDB<IntakeDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Version 1 Stores
                if (oldVersion < 1) {
                    const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
                    syncStore.createIndex('by-status', 'status');
                    syncStore.createIndex('by-created', 'createdAt');

                    db.createObjectStore('intake-drafts', { keyPath: 'id' });
                }

                // Version 2 Stores - Safety Backups
                if (oldVersion < 2) {
                    const backupStore = db.createObjectStore('intake-backups', { keyPath: 'id' });
                    backupStore.createIndex('by-form', 'formId');
                    backupStore.createIndex('by-date', 'createdAt');
                }
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

export const saveBackup = async (formId: string, data: any) => {
    const db = await getDB();
    if (!db) return;

    const backup: IntakeBackup = {
        id: crypto.randomUUID(),
        formId,
        data,
        createdAt: Date.now()
    };

    await db.put('intake-backups', backup);
    return backup;
};

export const getBackups = async (formId: string) => {
    const db = await getDB();
    if (!db) return [];
    return db.getAllFromIndex('intake-backups', 'by-form', formId);
};
