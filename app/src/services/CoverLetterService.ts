import { aiService } from '@/lib/ai/UnifiedAIService';
import { JSONResume } from './ResumeMapperService';

export interface CoverLetter {
    id: string;
    client_id: string;
    intake_id: string;
    company_name: string;
    position: string;
    content: string;
    template: string;
    created_at: string;
}

export interface CoverLetterTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
}

export class CoverLetterService {
    constructor() { }

    /**
     * Generate cover letter from resume and job details
     */
    async generateCoverLetter(
        resume: JSONResume,
        companyName: string,
        position: string,
        jobDescription?: string
    ): Promise<string> {
        const prompt = this.buildCoverLetterPrompt(resume, companyName, position, jobDescription);

        const responseText = await aiService.ask({
            prompt,
            temperature: 0.7,
        });

        return this.formatCoverLetter(responseText, resume, companyName, position);
    }

    /**
     * Get cover letter templates
     */
    getTemplates(): CoverLetterTemplate[] {
        return [
            {
                id: 'professional',
                name: 'Professional',
                description: 'Standard professional cover letter format',
                template: 'professional',
            },
            {
                id: 'creative',
                name: 'Creative',
                description: 'More personalized and engaging tone',
                template: 'creative',
            },
            {
                id: 'technical',
                name: 'Technical',
                description: 'Focused on technical skills and achievements',
                template: 'technical',
            },
        ];
    }

    /**
     * Export cover letter to plain text
     */
    exportToText(content: string): string {
        return content;
    }

    /**
     * Convert cover letter to HTML for PDF export
     */
    convertToHTML(content: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 1in auto;
            padding: 0;
            color: #000;
        }
        p {
            margin-bottom: 1em;
        }
        .header {
            margin-bottom: 2em;
        }
        .signature {
            margin-top: 2em;
        }
    </style>
</head>
<body>
    ${content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>
`;
    }

    private buildCoverLetterPrompt(
        resume: JSONResume,
        companyName: string,
        position: string,
        jobDescription?: string
    ): string {
        const workExperience = resume.work?.slice(0, 2).map(w =>
            `${w.position} at ${w.name}: ${w.summary || w.highlights?.join(', ') || 'Responsibilities included various tasks'}`
        ).join('. ') || 'No work experience listed';

        const skills = resume.skills?.flatMap(s => s.keywords).slice(0, 8).join(', ') || 'various professional skills';

        const education = resume.education?.[0]
            ? `${resume.education[0].studyType} in ${resume.education[0].area} from ${resume.education[0].institution}`
            : 'relevant educational background';

        return `
You are a professional cover letter writer. Generate a compelling cover letter for this candidate.

Candidate Information:
- Name: ${resume.basics.name}
- Email: ${resume.basics.email}
- Phone: ${resume.basics.phone}
- Summary: ${resume.basics.summary || 'Motivated professional seeking new opportunities'}
- Recent Work Experience: ${workExperience}
- Education: ${education}
- Key Skills: ${skills}

Job Information:
- Company: ${companyName}
- Position: ${position}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

Requirements:
- Professional and enthusiastic tone
- 3-4 paragraphs
- Opening: Express interest and mention how you learned about the position
- Body: Highlight 2-3 relevant experiences/skills that match the role
- Closing: Express enthusiasm and request an interview
- Include specific examples from work experience
- Tailor to the job description if provided
- Keep it concise (under 400 words)

Generate ONLY the cover letter body (no header/footer with address), starting with "Dear Hiring Manager,"

Do not include any additional commentary, formatting instructions, or explanations.
`;
    }

    private formatCoverLetter(
        content: string,
        resume: JSONResume,
        companyName: string,
        position: string
    ): string {
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const address = resume.basics.location
            ? `${resume.basics.location.address || ''}\n${resume.basics.location.city || ''}, ${resume.basics.location.region || ''} ${resume.basics.location.postalCode || ''}`.trim()
            : '';

        return `
${resume.basics.name}
${address}
${resume.basics.email}
${resume.basics.phone}

${today}

Hiring Manager
${companyName}

Re: Application for ${position}

${content.trim()}

Sincerely,
${resume.basics.name}
`.trim();
    }
}

export const coverLetterService = new CoverLetterService();
