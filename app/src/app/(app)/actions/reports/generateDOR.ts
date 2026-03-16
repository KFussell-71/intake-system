'use server';

import { UnifiedAIService } from '@/lib/ai/UnifiedAIService';
import { intakeService } from '@/services/IntakeService';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

const aiService = new UnifiedAIService();

/**
 * Server Action: Generate DOR Report using AI.
 * MIGRATED WITH UNIFIED AUDITING
 */
export async function generateDORReport(intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

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
        2. **Employment Goal**: 30-day focus.
        3. **Desired Job Titles**: Distinguish immediate vs long-term.
        4. **Target Pay**: Min hourly wage.
        5. **Skills & Experience**: Summarize past roles.
        6. **Barriers**: List barriers.
        7. **Support Services**: Gas, clothes, etc.
        8. **Readiness**: Estimate 1-10.
        9. **Conclusion**: Narrative summary.
        
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

        const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonResponse);

        // 4. Unified Audit Log
        await auditService.log({
            userId: auth.userId!,
            action: 'CREATE',
            entityType: 'dor_report_generation',
            entityId: intakeId,
            details: { status: 'generated' }
        });

        return { success: true, report: parsed, raw: intakeData };

    } catch (error: any) {
        console.error('DOR Report Generation Error:', error);

        await auditService.log({
            userId: auth.userId || 'system',
            action: 'ERROR',
            entityType: 'dor_report_generation',
            entityId: intakeId,
            details: { error: error.message }
        });

        return { success: false, error: 'Failed to generate report' };
    }
}
