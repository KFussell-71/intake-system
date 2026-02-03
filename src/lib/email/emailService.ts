/**
 * Email Notification Service
 * 
 * Sends automated emails for critical events using Resend
 */

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const isDev = !apiKey || apiKey.startsWith('re_placeholder');

/**
 * Send report submitted email to supervisor
 */
export async function sendReportSubmittedEmail(params: {
    supervisorEmail: string;
    supervisorName: string;
    staffName: string;
    clientName: string;
    reportId: string;
}) {
    if (isDev) {
        console.log('📧 [DEV MODE] Email would be sent:', {
            to: params.supervisorEmail,
            subject: `New Report Submitted: ${params.clientName}`,
            template: 'ReportSubmitted'
        });
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: params.supervisorEmail,
            subject: `New Report Submitted: ${params.clientName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f8fafc; padding: 20px; }
                        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Report Submitted</h2>
                        </div>
                        <div class="content">
                            <p>Hi ${params.supervisorName},</p>
                            <p><strong>${params.staffName}</strong> has submitted a report for <strong>${params.clientName}</strong> and it's ready for your review.</p>
                            <a href="${APP_URL}/supervisor/review-queue" class="button">Review Report</a>
                        </div>
                        <div class="footer">
                            <p>DOR Intake System | Automated Notification</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to send report submitted email:', error);
        return { success: false, error };
    }
}

/**
 * Send report returned email to staff (URGENT)
 */
export async function sendReportReturnedEmail(params: {
    staffEmail: string;
    staffName: string;
    clientName: string;
    reason: string;
    notes: string;
    reportId: string;
    urgent: boolean;
}) {
    if (isDev) {
        console.log('📧 [DEV MODE] Email would be sent:', {
            to: params.staffEmail,
            subject: params.urgent ? `URGENT: Returned` : `Returned`,
            template: 'ReportReturned'
        });
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: params.staffEmail,
            subject: params.urgent
                ? `🔴 URGENT: Report Returned - ${params.clientName}`
                : `Report Returned for Revision - ${params.clientName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: ${params.urgent ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f8fafc; padding: 20px; }
                        .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; }
                        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>${params.urgent ? '🔴 URGENT: ' : ''}Report Returned for Revision</h2>
                        </div>
                        <div class="content">
                            <p>Hi ${params.staffName},</p>
                            <p>Your report for <strong>${params.clientName}</strong> has been returned for revision.</p>
                            
                            ${params.urgent ? '<div class="alert"><strong>⚠️ This requires urgent attention</strong></div>' : ''}
                            
                            <p><strong>Reason:</strong> ${params.reason}</p>
                            <p><strong>Feedback:</strong></p>
                            <p>${params.notes}</p>
                            
                            <a href="${APP_URL}/reports/${params.reportId}" class="button">View Report</a>
                        </div>
                        <div class="footer">
                            <p>DOR Intake System | Automated Notification</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to send report returned email:', error);
        return { success: false, error };
    }
}

/**
 * Send report approved email to staff
 */
export async function sendReportApprovedEmail(params: {
    staffEmail: string;
    staffName: string;
    clientName: string;
    reportId: string;
}) {
    if (isDev) {
        console.log('📧 [DEV MODE] Email would be sent:', {
            to: params.staffEmail,
            subject: `Approved: ${params.clientName}`,
            template: 'ReportApproved'
        });
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: params.staffEmail,
            subject: `✅ Report Approved - ${params.clientName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f8fafc; padding: 20px; }
                        .success { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 16px 0; }
                        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>✅ Report Approved</h2>
                        </div>
                        <div class="content">
                            <p>Hi ${params.staffName},</p>
                            <div class="success">
                                <strong>Great work!</strong> Your report for <strong>${params.clientName}</strong> has been approved.
                            </div>
                            <a href="${APP_URL}/reports/${params.reportId}" class="button">View Report</a>
                        </div>
                        <div class="footer">
                            <p>DOR Intake System | Automated Notification</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to send report approved email:', error);
        return { success: false, error };
    }
}

/**
 * Send worker assignment email
 */
export async function sendWorkerAssignmentEmail(params: {
    workerEmail: string;
    workerName: string;
    clientName: string;
    clientId: string;
    assignmentType: string;
}) {
    if (isDev) {
        console.log('📧 [DEV MODE] Email would be sent:', {
            to: params.workerEmail,
            subject: `New Assignment: ${params.clientName}`,
            template: 'WorkerAssignment'
        });
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: params.workerEmail,
            subject: `New Client Assignment - ${params.clientName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f8fafc; padding: 20px; }
                        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Client Assignment</h2>
                        </div>
                        <div class="content">
                            <p>Hi ${params.workerName},</p>
                            <p>You've been assigned as the <strong>${params.assignmentType}</strong> employment specialist for <strong>${params.clientName}</strong>.</p>
                            <a href="${APP_URL}/clients/${params.clientId}" class="button">View Client</a>
                        </div>
                        <div class="footer">
                            <p>DOR Intake System | Automated Notification</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to send worker assignment email:', error);
        return { success: false, error };
    }
}
