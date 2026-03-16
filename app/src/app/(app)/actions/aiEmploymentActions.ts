'use server';

import { coverLetterService } from '@/services/CoverLetterService';
import { aiResumeOptimizerService } from '@/services/AIResumeOptimizerService';
import { JSONResume } from '@/services/ResumeMapperService';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Generate a cover letter
 * MIGRATED TO PRISMA AUDIT
 */
export async function generateCoverLetterAction(
    resume: JSONResume,
    companyName: string,
    position: string,
    jobDescription?: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const content = await coverLetterService.generateCoverLetter(
            resume,
            companyName,
            position,
            jobDescription
        );

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'cover_letter',
            entityId: 'ai_generation',
            details: { companyName, position }
        });

        return { success: true, content };
    } catch (error: any) {
        console.error('[AI_ACTION] Cover Letter Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate cover letter'
        };
    }
}

/**
 * Server Action: Optimize a resume
 */
export async function optimizeResumeAction(resume: JSONResume, targetJob?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const result = await aiResumeOptimizerService.optimizeResume(resume, targetJob);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'resume_optimization',
            entityId: 'ai_generation',
            details: { targetJob }
        });

        return { success: true, ...result };
    } catch (error: any) {
        console.error('[AI_ACTION] Optimization Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to optimize resume'
        };
    }
}

/**
 * Server Action: Generate a professional summary
 */
export async function generateSummaryAction(resume: JSONResume, targetJob?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const summary = await aiResumeOptimizerService.generateSummary(resume, targetJob);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'resume_summary',
            entityId: 'ai_generation',
            details: { targetJob }
        });

        return { success: true, summary };
    } catch (error: any) {
        console.error('[AI_ACTION] Summary Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate summary'
        };
    }
}

/**
 * Server Action: Improve a job description
 */
export async function improveJobDescriptionAction(jobTitle: string, description: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const improved = await aiResumeOptimizerService.improveJobDescription(jobTitle, description);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'job_description_improvement',
            entityId: 'ai_generation',
            details: { jobTitle }
        });

        return { success: true, improved };
    } catch (error: any) {
        console.error('[AI_ACTION] Job Improvement Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to improve description'
        };
    }
}

/**
 * Server Action: Suggest skills
 */
export async function suggestSkillsAction(jobDescription: string, currentSkills: string[]) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const skills = await aiResumeOptimizerService.suggestSkills(jobDescription, currentSkills);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'skill_suggestion',
            entityId: 'ai_generation'
        });

        return { success: true, skills };
    } catch (error: any) {
        console.error('[AI_ACTION] Skill Suggestion Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to suggest skills'
        };
    }
}

/**
 * Server Action: Optimize for ATS
 */
export async function optimizeForATSAction(resume: JSONResume, jobDescription?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const suggestions = await aiResumeOptimizerService.optimizeForATS(resume, jobDescription);

        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'ats_optimization',
            entityId: 'ai_generation'
        });

        return { success: true, suggestions };
    } catch (error: any) {
        console.error('[AI_ACTION] ATS Optimization Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to optimize for ATS'
        };
    }
}
