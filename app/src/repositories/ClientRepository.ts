import { BaseRepository } from './BaseRepository';
import { ClientAggregate, IntakeEntity } from '@/domain/entities/ClientAggregate';
import type { CreateCaseNoteParams } from '@/features/cases/types';
import type { IntakeFormData } from '@/features/intake/intakeTypes';

export interface ClientPayload {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    ssn_last_four?: string;
    created_by?: string;
}

export interface IntakePayload {
    client_id: string;
    report_date: string;
    prepared_by?: string;
    completion_date?: string;
    data?: Partial<IntakeFormData>;
}

export interface CreateClientIntakeParams {
    p_name: string;
    p_phone?: string;
    p_email?: string;
    p_address?: string;
    p_ssn_last_four: string;
    p_report_date: string;
    p_completion_date?: string;
    p_intake_data: Partial<IntakeFormData>;
}

export class ClientRepository extends BaseRepository {
    async createClient(clientData: ClientPayload) {
        try {
            return await this.db.client.create({
                data: {
                    name: clientData.name,
                    phone: clientData.phone,
                    email: clientData.email,
                    address: clientData.address,
                    ssnLastFour: clientData.ssn_last_four,
                    createdById: clientData.created_by
                }
            });
        } catch (error: any) {
            this.handleError(error, 'createClient');
        }
    }

    async createIntake(intakeData: IntakePayload) {
        try {
            return await this.db.intake.create({
                data: {
                    clientId: intakeData.client_id,
                    reportDate: new Date(intakeData.report_date),
                    preparedById: intakeData.prepared_by,
                    completionDate: intakeData.completion_date ? new Date(intakeData.completion_date) : null,
                    data: (intakeData.data as any) || {},
                    status: 'draft'
                }
            });
        } catch (error: any) {
            this.handleError(error, 'createIntake');
        }
    }

    async createClientWithIntakeRPC(params: CreateClientIntakeParams) {
        try {
            const result = await this.db.$transaction(async (tx) => {
                const newClient = await tx.client.create({
                    data: {
                        name: params.p_name,
                        phone: params.p_phone,
                        email: params.p_email,
                        address: params.p_address,
                        ssnLastFour: params.p_ssn_last_four,
                    }
                });

                const newIntake = await tx.intake.create({
                    data: {
                        clientId: newClient.id,
                        reportDate: new Date(params.p_report_date),
                        completionDate: params.p_completion_date ? new Date(params.p_completion_date) : null,
                        data: params.p_intake_data as any,
                        status: 'draft'
                    }
                });

                return { client_id: newClient.id, intake_id: newIntake.id };
            });
            return result;
        } catch (error: any) {
            this.handleError(error, 'createClientWithIntakeRPC');
            return null;
        }
    }

    // --- Phase 9: Client Profile & Case Management ---

    async getClientProfile(clientId: string) {
        try {
            return await this.db.client.findUnique({
                where: { id: clientId },
                include: {
                    intakes: {
                        select: {
                            id: true,
                            status: true,
                            reportDate: true,
                            data: true
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            username: true,
                            role: true
                        }
                    }
                }
            });
        } catch (error: any) {
            this.handleError(error, 'getClientProfile');
        }
    }

    async getCaseNotes(clientId: string) {
        try {
            return await this.db.caseNote.findMany({
                where: { clientId },
                include: {
                    author: {
                        select: {
                            username: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error: any) {
            this.handleError(error, 'getCaseNotes');
        }
    }

    async createCaseNote(note: CreateCaseNoteParams) {
        try {
            return await this.db.caseNote.create({
                data: {
                    clientId: note.client_id,
                    authorId: note.author_id,
                    content: note.content,
                    type: note.type || 'general',
                    caseId: note.case_id || null
                }
            });
        } catch (error: any) {
            this.handleError(error, 'createCaseNote');
        }
    }

    async getTimelineEvents(clientId: string) {
        // Placeholder for complex RPC logic - combined query of various models
        try {
            const [intakes, appointments, notes] = await Promise.all([
                this.db.intake.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } }),
                this.db.appointment.findMany({ where: { clientId }, orderBy: { startTime: 'desc' } }),
                this.db.caseNote.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } })
            ]);

            // Combine and format similarly to what RPC did
            const events = [
                ...intakes.map(i => ({ id: i.id, type: 'intake', date: i.createdAt, title: `Intake: ${i.status}` })),
                ...appointments.map(a => ({ id: a.id, type: 'appointment', date: a.startTime, title: `Appt: ${a.title}` })),
                ...notes.map(n => ({ id: n.id, type: 'note', date: n.createdAt, title: `Note: ${n.type}` }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime());

            return events;
        } catch (error: any) {
            this.handleError(error, 'getTimelineEvents');
            return [];
        }
    }

    /**
     * Reconstructs a rich Domain Aggregate from database rows.
     */
    async loadClientAggregate(clientId: string): Promise<ClientAggregate> {
        try {
            const data = await this.db.client.findUnique({
                where: { id: clientId },
                include: {
                    intakes: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });

            if (!data) throw new Error('Client not found');

            const intakes = (data.intakes || []).map((i: any) =>
                new IntakeEntity(i.id, i.data, i.status)
            );

            return new ClientAggregate(data.id, data.name, intakes);
        } catch (error: any) {
            this.handleError(error, 'loadClientAggregate');
            throw error;
        }
    }
}

export const clientRepository = new ClientRepository();

