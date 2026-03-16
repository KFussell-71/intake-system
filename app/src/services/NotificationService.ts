import { prisma } from '@/lib/auth/authHelpersServer';
import { communicationService } from './CommunicationService';

export class NotificationService {
    /**
     * Send an automated milestone alert to a client
     */
    async sendMilestoneAlert(clientId: string, milestoneName: string, caseId: string, userId: string = 'system') {
        // 1. Log internal notification via Prisma
        try {
            await prisma.notification.create({
                data: {
                    clientId: clientId,
                    type: 'milestone',
                    message: `Congratulations! You've achieved a new milestone: ${milestoneName}`,
                    isRead: false
                }
            });
        } catch (error) {
            console.error('Failed to create internal notification:', error);
        }

        // 2. Fetch client contact info for external alerts
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { name: true, email: true, phone: true }
        });

        if (!client) return;

        // 3. Simulate SMS alert (Twilio)
        if (client.phone) {
            await communicationService.sendMessage({
                case_id: caseId,
                client_id: clientId,
                type: 'sms',
                content: `Hi ${client.name}, great news! You've completed the milestone: ${milestoneName}. Check your portal for more details.`,
                sender_id: userId
            });
        }

        // 4. Simulate Email alert (Resend)
        if (client.email) {
            await communicationService.sendMessage({
                case_id: caseId,
                client_id: clientId,
                type: 'email',
                content: `
                    <h1>Congratulations, ${client.name}!</h1>
                    <p>We're thrilled to inform you that you've successfully completed your milestone: <strong>${milestoneName}</strong>.</p>
                    <p>Your hard work is paying off. Log in to your participant portal to view your progress and next steps.</p>
                `,
                sender_id: userId
            });
        }
    }

    /**
     * Notify about new document requested
     */
    async sendDocumentRequestAlert(clientId: string, documentType: string, caseId: string, userId: string = 'system') {
        try {
            await prisma.notification.create({
                data: {
                    clientId: clientId,
                    type: 'document_request',
                    message: `Action Required: Please upload your ${documentType}.`,
                    isRead: false
                }
            });
        } catch (error) {
            console.error('Failed to create document notification:', error);
        }

        // External alert simulation...
    }
}

export const notificationService = new NotificationService();
