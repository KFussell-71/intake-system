import { supabase } from '@/lib/supabase';
import { communicationService } from './CommunicationService';

export class NotificationService {
    /**
     * Send an automated milestone alert to a client
     */
    async sendMilestoneAlert(clientId: string, milestoneName: string, caseId: string) {
        // 1. Log internal notification
        const { error: notifyError } = await supabase
            .from('notifications')
            .insert({
                client_id: clientId,
                type: 'milestone',
                message: `Congratulations! You've achieved a new milestone: ${milestoneName}`,
                is_read: false
            });

        if (notifyError) console.error('Failed to create internal notification:', notifyError);

        // 2. Fetch client contact info for external alerts
        const { data: client } = await supabase
            .from('clients')
            .select('name, email, phone')
            .eq('id', clientId)
            .single();

        if (!client) return;

        // 3. Simulate SMS alert (Twilio)
        if (client.phone) {
            await communicationService.sendMessage({
                case_id: caseId,
                client_id: clientId,
                type: 'sms',
                content: `Hi ${client.name}, great news! You've completed the milestone: ${milestoneName}. Check your portal for more details.`
            });
        }

        // 4. Simulate Email alert (Resend)
        if (client.email) {
            await communicationService.sendMessage({
                case_id: caseId,
                client_id: clientId,
                type: 'email',
                subject: `Milestone Achieved: ${milestoneName}`,
                content: `
                    <h1>Congratulations, ${client.name}!</h1>
                    <p>We're thrilled to inform you that you've successfully completed your milestone: <strong>${milestoneName}</strong>.</p>
                    <p>Your hard work is paying off. Log in to your participant portal to view your progress and next steps.</p>
                `
            });
        }
    }

    /**
     * Notify about new document requested
     */
    async sendDocumentRequestAlert(clientId: string, documentType: string, caseId: string) {
        await supabase
            .from('notifications')
            .insert({
                client_id: clientId,
                type: 'document_request',
                message: `Action Required: Please upload your ${documentType}.`,
                is_read: false
            });

        // External alert simulation...
    }
}

export const notificationService = new NotificationService();
