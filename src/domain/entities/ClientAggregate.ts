import type { IntakeFormData } from '@/features/intake/types/intake';

export interface IntakeVersion {
    data: Partial<IntakeFormData>;
    changeSummary: string;
    createdAt: number;
    createdBy: string;
}

export class IntakeEntity {
    constructor(
        public readonly id: string,
        private _data: IntakeFormData,
        private _status: 'draft' | 'submitted' | 'approved' | 'archived',
        private _versions: IntakeVersion[] = []
    ) { }

    get data() { return { ...this._data }; }
    get status() { return this._status; }
    get versions() { return [...this._versions]; }

    /**
     * Business Invariant: Data cannot be modified once approved.
     */
    updateData(newData: Partial<IntakeFormData>, summary: string, userId: string) {
        if (this._status === 'approved' || this._status === 'archived') {
            throw new Error(`Cannot update intake in ${this._status} state.`);
        }

        // Snapshot current state before update
        this._versions.push({
            data: { ...this._data },
            changeSummary: summary,
            createdAt: Date.now(),
            createdBy: userId
        });

        this._data = { ...this._data, ...newData };
    }

    submit() {
        if (this._status !== 'draft') {
            throw new Error(`Can only submit from draft state. Current: ${this._status}`);
        }
        // Potential business validation here
        this._status = 'submitted';
    }

    approve() {
        if (this._status !== 'submitted') {
            throw new Error(`Can only approve submitted intakes.`);
        }
        this._status = 'approved';
    }
}

export class ClientAggregate {
    constructor(
        public readonly id: string,
        private _name: string,
        private _intakes: IntakeEntity[] = []
    ) { }

    get name() { return this._name; }
    get intakes() { return [...this._intakes]; }

    addIntake(intake: IntakeEntity) {
        // Enforce limit: One active intake at a time?
        const active = this._intakes.find(i => i.status !== 'approved' && i.status !== 'archived');
        if (active) {
            throw new Error('Client already has an active intake.');
        }
        this._intakes.push(intake);
    }

    get activeIntake() {
        return this._intakes.find(i => i.status !== 'approved' && i.status !== 'archived');
    }
}
