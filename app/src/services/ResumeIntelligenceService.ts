import { aiService } from '@/lib/ai/UnifiedAIService';
import { JSONResume } from './ResumeMapperService';
import { prisma } from '@/lib/auth/authHelpersServer';

/**
 * ResumeIntelligenceService
 * 
 * Orchestrates high-impact resume drafting by leveraging the 
 * Clinical/Self-Report split (Phase 12) and Local AI.
 */
export class ResumeIntelligenceService {
    private get db() {
        return prisma;
    }

    /**
     * Draft high-impact bullet points for work experience
     */
    async draftWorkHighlights(jobTitle: string, rawResponsibilities: string, clientVoice?: string, counselorAssessment?: string): Promise<string[]> {
        const prompt = `
You are an expert vocational resume writer. 
Convert the following job responsibilities into 3-5 high-impact, achievement-oriented bullet points.

JOB TITLE: ${jobTitle}
RAW RESPONSIBILITIES: ${rawResponsibilities}
${clientVoice ? `CLIENT'S REPORTED GOALS: ${clientVoice}` : ''}
${counselorAssessment ? `PROFESSIONAL ASSESSMENT: ${counselorAssessment}` : ''}

REQUIREMENTS:
- Use strong action verbs (Spearheaded, Optimized, Managed).
- Focus on transferable skills and accomplishments.
- Match industry standards for the role.
- Keep each bullet point under 20 words.
- Return ONLY the bullet points, one per line, starting with a dash (-).

GOAL: Bridge the gap between what the client did and what employers want to see.
`;

        const response = await aiService.ask({
            prompt,
            temperature: 0.7,
            isPHISensitive: false // Resume drafting isn't PHI-sensitive if names are omitted from prompt
        });

        return response
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim())
            .slice(0, 5);
    }

    /**
     * Generate an AI-optimized summary that balances Client Voice and Professional Assessment
     */
    async draftProfessionalSummary(resume: JSONResume, clientStatement?: string, professionalAssessment?: string): Promise<string> {
        const skills = resume.skills?.flatMap(s => s.keywords).join(', ') || 'Various professional skills';
        const topJobs = resume.work?.slice(0, 2).map(w => w.position).join(', ') || 'Experienced professional';

        const prompt = `
Generate a 3-sentence professional resume summary for a candidate with the following background:

TOP ROLES: ${topJobs}
KEY SKILLS: ${skills}
${clientStatement ? `CLIENT'S SELF-REPORTED INTERESTS: ${clientStatement}` : ''}
${professionalAssessment ? `CLINICAL ELIGIBILITY RATIONALE: ${professionalAssessment}` : ''}

TONE: Professional, confident, and focused on vocational success.
FORMAT: Return only the final summary text.
`;

        return await aiService.ask({
            prompt,
            temperature: 0.7,
            isPHISensitive: false
        });
    }

    /**
     * Enhanced resume generation that incorporates Phase 12 split data
     */
    async enhanceResumeWithIntelligence(intakeId: string, baseResume: JSONResume): Promise<JSONResume> {
        // 1. Fetch Phase 12 split data
        const statement = await this.db.clientStatement.findUnique({
            where: { intakeId }
        });

        const assessment = await this.db.intakeAssessment.findUnique({
            where: { intakeId }
        });

        const enhancedResume = { ...baseResume };

        // 2. Draft intelligence-driven summary
        enhancedResume.basics.summary = await this.draftProfessionalSummary(
            baseResume,
            statement?.presentingIssue || undefined,
            assessment?.eligibilityRationale || undefined
        );

        // 3. Optimize work highlights for top 3 jobs
        if (enhancedResume.work) {
            const updatedWork = await Promise.all(enhancedResume.work.slice(0, 3).map(async (job) => {
                const highlights = await this.draftWorkHighlights(
                    job.position,
                    job.summary || '',
                    statement?.goalsAndObjectives || undefined,
                    assessment?.clinicalNarrative || undefined
                );
                return { ...job, highlights };
            }));

            // Merge back
            enhancedResume.work = [
                ...updatedWork,
                ...enhancedResume.work.slice(3)
            ];
        }

        return enhancedResume;
    }
}

export const resumeIntelligenceService = new ResumeIntelligenceService();
