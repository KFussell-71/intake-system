'use server';

import { coverLetterService } from '@/services/CoverLetterService';
import { aiResumeOptimizerService } from '@/services/AIResumeOptimizerService';
import { JSONResume } from '@/services/ResumeMapperService';

/**
 * Server Action: Generate a cover letter
 */
export async function generateCoverLetterAction(
    resume: JSONResume,
    companyName: string,
    position: string,
    jobDescription?: string
) {
    try {
        console.log(`[AI_ACTION] Generating cover letter for ${companyName} - ${position}`);
        const content = await coverLetterService.generateCoverLetter(
            resume,
            companyName,
            position,
            jobDescription
        );
        return { success: true, content };
    } catch (error) {
        console.error('[AI_ACTION] Cover Letter Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate cover letter'
        };
    }
}

/**
 * Server Action: Optimize a resume
 */
export async function optimizeResumeAction(resume: JSONResume, targetJob?: string) {
    try {
        console.log(`[AI_ACTION] Optimizing resume for ${targetJob || 'general purpose'}`);
        const result = await aiResumeOptimizerService.optimizeResume(resume, targetJob);
        return { success: true, ...result };
    } catch (error) {
        console.error('[AI_ACTION] Optimization Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to optimize resume'
        };
    }
}

/**
 * Server Action: Generate a professional summary
 */
export async function generateSummaryAction(resume: JSONResume, targetJob?: string) {
    try {
        console.log(`[AI_ACTION] Generating professional summary`);
        const summary = await aiResumeOptimizerService.generateSummary(resume, targetJob);
        return { success: true, summary };
    } catch (error) {
        console.error('[AI_ACTION] Summary Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate summary'
        };
    }
}

/**
 * Server Action: Improve a job description
 */
export async function improveJobDescriptionAction(jobTitle: string, description: string) {
    try {
        console.log(`[AI_ACTION] Improving job description for ${jobTitle}`);
        const improved = await aiResumeOptimizerService.improveJobDescription(jobTitle, description);
        return { success: true, improved };
    } catch (error) {
        console.error('[AI_ACTION] Job Improvement Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to improve description'
        };
    }
}

/**
 * Server Action: Suggest skills
 */
export async function suggestSkillsAction(jobDescription: string, currentSkills: string[]) {
    try {
        console.log(`[AI_ACTION] Suggesting skills based on job description`);
        const skills = await aiResumeOptimizerService.suggestSkills(jobDescription, currentSkills);
        return { success: true, skills };
    } catch (error) {
        console.error('[AI_ACTION] Skill Suggestion Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to suggest skills'
        };
    }
}

/**
 * Server Action: Optimize for ATS
 */
export async function optimizeForATSAction(resume: JSONResume, jobDescription?: string) {
    try {
        console.log(`[AI_ACTION] Optimizing for ATS`);
        const suggestions = await aiResumeOptimizerService.optimizeForATS(resume, jobDescription);
        return { success: true, suggestions };
    } catch (error) {
        console.error('[AI_ACTION] ATS Optimization Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to optimize for ATS'
        };
    }
}
