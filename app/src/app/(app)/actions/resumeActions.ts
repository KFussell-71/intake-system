'use server';

import { verifyAuthentication, verifyClientAccess } from '@/lib/auth/authHelpersServer';
import { resumeRepository, CreateResumeData } from '@/repositories/ResumeRepository';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create a new resume record
 */
export async function createResumeAction(clientId: string, data: Omit<CreateResumeData, 'clientId'>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    // Ensure access to this client
    const hasAccess = await verifyClientAccess(clientId);
    if (!hasAccess) {
        return { success: false, error: 'Forbidden: No access to this client' };
    }

    try {
        const resume = await resumeRepository.createResume({
            ...data,
            clientId
        }, auth.userId);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'client_resume',
            entityId: resume.id,
            details: { intakeId: data.intakeId, resumeId: data.resumeId }
        });

        revalidatePath(`/client/${clientId}`);
        return { success: true, data: resume };
    } catch (error: any) {
        console.error('Error creating resume:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get resumes for a client
 */
export async function getClientResumesAction(clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    const hasAccess = await verifyClientAccess(clientId);
    if (!hasAccess) return { success: false, error: 'Forbidden' };

    try {
        const resumes = await resumeRepository.getResumesByClient(clientId);
        return { success: true, data: resumes };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete a resume
 */
export async function deleteResumeAction(resumeId: string, clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    const hasAccess = await verifyClientAccess(clientId);
    if (!hasAccess) return { success: false, error: 'Forbidden' };

    try {
        await resumeRepository.deleteResume(resumeId, auth.userId);

        await auditService.log({
            userId: auth.userId,
            action: 'DELETE',
            entityType: 'client_resume',
            entityId: resumeId,
            details: { clientId }
        });

        revalidatePath(`/client/${clientId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update PDF URL
 */
export async function updateResumePdfUrlAction(resumeId: string, pdfUrl: string, clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    const hasAccess = await verifyClientAccess(clientId);
    if (!hasAccess) return { success: false, error: 'Forbidden' };

    try {
        await resumeRepository.updatePdfUrl(resumeId, pdfUrl, auth.userId);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
