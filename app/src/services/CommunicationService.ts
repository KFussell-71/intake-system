import { prisma } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

export interface CommunicationLog {
    id: string;
    case_id: string;
    client_id?: string;
    type: 'email' | 'sms' | 'internal';
    direction: 'inbound' | 'outbound';
    content: string;
    subject?: string;
    status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
    sent_at: Date;
    read_at?: Date;
    sender_id?: string;
    recipient_contact?: string;
    created_at: Date;
    sender?: {
        fullName: string;
        email: string;
    };
}

/**
 * CommunicationService (Refactored to Prisma)
 */
export class CommunicationService {
    /**
     * Get communication history for a case
     */
    async getCaseCommunications(caseId: string): Promise<CommunicationLog[]> {
        const logs = await prisma.communicationLog.findMany({
            where: { caseId },
            include: {
                sender: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return logs.map((log: any) => ({
            id: log.id,
            case_id: log.caseId,
            client_id: log.clientId || undefined,
            type: log.type as any,
            direction: log.direction as any,
            content: log.content,
            status: log.status as any,
            sent_at: log.sentAt,
            created_at: log.createdAt,
            sender: log.sender ? {
                fullName: log.sender.fullName,
                email: log.sender.email!
            } : undefined
        }));
    }

    /**
     * Get communication history for a portal client
     */
    async getPortalMessages(clientId: string): Promise<CommunicationLog[]> {
        const logs = await prisma.communicationLog.findMany({
            where: { clientId },
            include: {
                sender: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return logs.map((log: any) => ({
            id: log.id,
            case_id: log.caseId,
            client_id: log.clientId!,
            type: log.type as any,
            direction: log.direction as any,
            content: log.content,
            status: log.status as any,
            sent_at: log.sentAt,
            created_at: log.createdAt,
            sender: log.sender ? {
                fullName: log.sender.fullName,
                email: log.sender.email!
            } : undefined
        }));
    }

    /**
     * Send a message
     */
    async sendMessage(data: {
        case_id: string;
        client_id?: string;
        type: 'email' | 'sms' | 'internal';
        direction?: 'inbound' | 'outbound';
        content: string;
        sender_id: string;
        recipient_contact?: string;
    }): Promise<CommunicationLog> {
        const log = await prisma.communicationLog.create({
            data: {
                caseId: data.case_id,
                clientId: data.client_id,
                type: data.type,
                direction: data.direction || 'outbound',
                content: data.content,
                senderId: data.sender_id,
                status: 'sent',
                sentAt: new Date(),
                recipientContact: data.recipient_contact
            },
            include: {
                sender: {
                    select: { fullName: true, email: true }
                }
            }
        });

        // Audit the communication
        await auditService.log({
            userId: data.sender_id,
            action: 'CREATE',
            entityType: 'communication',
            entityId: log.id,
            details: { type: data.type, direction: log.direction }
        });

        return {
            id: log.id,
            case_id: log.caseId,
            client_id: log.clientId || undefined,
            type: log.type as any,
            direction: log.direction as any,
            content: log.content,
            status: log.status as any,
            sent_at: log.sentAt,
            created_at: log.createdAt,
            sender: log.sender ? {
                fullName: log.sender.fullName,
                email: log.sender.email!
            } : undefined
        };
    }
}

export const communicationService = new CommunicationService();
