
'use server';

import { UnifiedAIService } from '@/lib/ai/UnifiedAIService';
import { intakeService } from '@/services/IntakeService';
import { IntakeFormData } from '@/features/intake/intakeTypes';

const aiService = new UnifiedAIService();

export async function generateDORReport(intakeId: string) {
    try {
        // 1. Fetch Data
        const intakeData = await intakeService.fetchServerData(intakeId);
        if (!intakeData) throw new Error('Intake data not found');

        // 2. Construct Prompt
        const prompt = `
        You are a master social worker and employment specialist. 
        Generate a "Participant Employment Services Intake Report" (DOR Report) for the following client.
        
        **Client Data:**
        Name: ${intakeData.clientName}
        Date: ${new Date().toLocaleDateString()}
        Assessment: ${JSON.stringify(intakeData)}

        **Instructions:**
        Fill out the following sections in a professional, empathetic tone.
        
        1. **Overview**: State they successfully completed intake.
        2. **Employment Goal**: 30-day focus (e.g., "Obtain employment within 30 days").
        3. **Desired Job Titles**: Distinguish immediate vs long-term.
        4. **Target Pay**: Min hourly wage.
        5. **Skills & Experience**: Summarize past roles.
        6. **Barriers**: List any health, transport, or other barriers.
        7. **Support Services**: What do they need? (Gas, clothes, etc.)
        8. **Readiness**: Estimate 1-10 based on motivation.
        9. **Conclusion**: A comprehensive narrative paragraph summarizing:
           - Previous work experience & skills.
           - Current education/training status.
           - Specific employment goals (immediate vs long-term).
           - Willingness to commute/relocate.
           - Job search history/activity.
           - Engagement level during intake.
           - Understanding of next steps (ISP).
        
        **Format:**
        Return JSON with the following keys:
        {
            "overview": string,
            "goal": string,
            "job_titles": string,
            "pay": string,
            "skills": string,
            "barriers": string,
            "support": string,
            "readiness": string,
            "conclusion": string
        }
        `;

        // 3. Generate
        const jsonResponse = await aiService.ask({
            prompt,
            temperature: 0.3
        });

        // 4. Parse (Simple heuristic extraction if strict JSON fails, but mistral is usually okay)
        // For robustness, we'll try to find the JSON blob
        const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonResponse);

        return { success: true, report: parsed, raw: intakeData };

    } catch (error) {
        console.error('DOR Report Generation Error:', error);
        return { success: false, error: 'Failed to generate report' };
    }
}
