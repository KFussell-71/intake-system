import { JSONResume } from './ResumeMapperService';

export interface OptimizationSuggestion {
    section: string;
    field: string;
    original: string;
    suggested: string;
    reason: string;
    confidence: number;
}

export interface OptimizationResult {
    optimizedResume: JSONResume;
    suggestions: OptimizationSuggestion[];
    summary: string;
}

export class AIResumeOptimizerService {
    private aiEndpoint: string;
    private model: string;

    constructor() {
        // Default to Ollama, fallback to Gemini
        this.aiEndpoint = process.env.AI_ENDPOINT || 'http://localhost:11434';
        this.model = process.env.AI_MODEL || 'llama3';
    }

    /**
     * Check if AI service is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.aiEndpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch (error) {
            console.warn('[AIOptimizer] Service not available:', error);
            return false;
        }
    }

    /**
     * Optimize resume content using AI
     */
    async optimizeResume(resume: JSONResume, targetJob?: string): Promise<OptimizationResult> {
        const prompt = this.buildOptimizationPrompt(resume, targetJob);

        const response = await fetch(`${this.aiEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`AI optimization failed: ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseOptimizationResponse(data.response, resume);
    }

    /**
     * Generate professional summary
     */
    async generateSummary(resume: JSONResume, targetJob?: string): Promise<string> {
        const workExperience = resume.work?.slice(0, 3).map(w =>
            `${w.position} at ${w.name} (${w.startDate} - ${w.endDate || 'Present'})`
        ).join(', ') || 'No work experience listed';

        const skills = resume.skills?.flatMap(s => s.keywords).slice(0, 10).join(', ') || 'No skills listed';

        const education = resume.education?.map(e =>
            `${e.studyType} in ${e.area} from ${e.institution}`
        ).join(', ') || 'No education listed';

        const prompt = `
You are a professional resume writer. Generate a compelling professional summary for this candidate.

Candidate Information:
- Name: ${resume.basics.name}
- Work Experience: ${workExperience}
- Education: ${education}
- Key Skills: ${skills}
${targetJob ? `- Target Job: ${targetJob}` : ''}

Requirements:
- 3-4 sentences maximum
- Highlight key strengths and achievements
- Use action verbs and quantifiable results where possible
- Professional tone
- Include ATS-optimized keywords
- Focus on value proposition

Generate ONLY the summary text, no additional commentary or formatting.
`;

        const response = await fetch(`${this.aiEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Summary generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response.trim();
    }

    /**
     * Improve job description
     */
    async improveJobDescription(jobTitle: string, description: string): Promise<string> {
        const prompt = `
Improve this job description for a resume. Make it more impactful and achievement-focused.

Job Title: ${jobTitle}
Current Description: ${description}

Requirements:
- Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
- Quantify achievements where possible (percentages, numbers, metrics)
- Highlight impact and results
- Keep it concise (3-5 bullet points)
- Professional tone
- Focus on accomplishments, not just responsibilities

Return ONLY the improved description as bullet points, one per line, starting with a dash (-).
`;

        const response = await fetch(`${this.aiEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Job description improvement failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response.trim();
    }

    /**
     * Suggest skills based on job description
     */
    async suggestSkills(jobDescription: string, currentSkills: string[]): Promise<string[]> {
        const prompt = `
Analyze this job description and suggest relevant skills that are missing from the candidate's current skills.

Job Description: ${jobDescription}
Current Skills: ${currentSkills.join(', ')}

Return ONLY a comma-separated list of 5-10 relevant skills that would strengthen this resume for this job.
Focus on skills that are:
- Mentioned in the job description
- Relevant to the role
- Not already in the current skills list
- Industry-standard and recognizable

Return only the skills, comma-separated, no additional text.
`;

        const response = await fetch(`${this.aiEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.6,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Skill suggestion failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
    }

    /**
     * Optimize for ATS (Applicant Tracking System)
     */
    async optimizeForATS(resume: JSONResume, jobDescription?: string): Promise<OptimizationSuggestion[]> {
        const prompt = `
Analyze this resume for ATS (Applicant Tracking System) optimization.

Resume Summary: ${resume.basics.summary || 'No summary'}
Skills: ${resume.skills?.flatMap(s => s.keywords).join(', ') || 'No skills'}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Provide specific suggestions to improve ATS compatibility:
1. Missing keywords from job description
2. Skills that should be added
3. Better formatting for ATS parsing
4. Industry-standard terminology

Return suggestions as a JSON array with this format:
[
  {
    "section": "skills",
    "field": "keywords",
    "original": "current value",
    "suggested": "improved value",
    "reason": "why this improves ATS score",
    "confidence": 0.9
  }
]

Return ONLY the JSON array, no additional text.
`;

        const response = await fetch(`${this.aiEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.5,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`ATS optimization failed: ${response.statusText}`);
        }

        const data = await response.json();

        try {
            // Try to parse JSON response
            const suggestions = JSON.parse(data.response);
            return Array.isArray(suggestions) ? suggestions : [];
        } catch (error) {
            console.warn('[AIOptimizer] Failed to parse ATS suggestions:', error);
            return [];
        }
    }

    private buildOptimizationPrompt(resume: JSONResume, targetJob?: string): string {
        return `
You are an expert resume writer and career coach. Analyze and optimize this resume.

Resume Data:
- Summary: ${resume.basics.summary || 'No summary'}
- Work Experience: ${resume.work?.length || 0} positions
- Education: ${resume.education?.length || 0} entries
- Skills: ${resume.skills?.flatMap(s => s.keywords).join(', ') || 'No skills'}

${targetJob ? `Target Job: ${targetJob}` : ''}

Provide optimization suggestions for:
1. Professional summary (make it more compelling)
2. Work experience descriptions (use action verbs, quantify achievements)
3. Skills keywords (add relevant, missing skills)
4. Overall ATS optimization

Return a JSON object with:
{
  "suggestions": [
    {
      "section": "summary",
      "field": "basics.summary",
      "original": "current text",
      "suggested": "improved text",
      "reason": "explanation",
      "confidence": 0.9
    }
  ],
  "summary": "Overall assessment and key recommendations"
}

Return ONLY the JSON object, no additional text.
`;
    }

    private parseOptimizationResponse(response: string, originalResume: JSONResume): OptimizationResult {
        try {
            const parsed = JSON.parse(response);
            return {
                optimizedResume: originalResume, // Apply suggestions to create optimized version
                suggestions: parsed.suggestions || [],
                summary: parsed.summary || '',
            };
        } catch (error) {
            // Fallback if AI doesn't return valid JSON
            console.warn('[AIOptimizer] Failed to parse response:', error);
            return {
                optimizedResume: originalResume,
                suggestions: [],
                summary: response.substring(0, 500), // Use first 500 chars as summary
            };
        }
    }
}

export const aiResumeOptimizerService = new AIResumeOptimizerService();
