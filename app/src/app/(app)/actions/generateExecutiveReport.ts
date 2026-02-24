"use server";

import { createClient } from "@/lib/supabase/server";
import { aiService } from "@/lib/ai/UnifiedAIService";
import { logSystemAction } from "./memoryActions"; // Reusing memory logging

export interface ExecutiveReportParams {
    lookbackDays: number;
    focusArea?: 'operational' | 'financial' | 'strategic';
}

export async function generateExecutiveReport(params: ExecutiveReportParams) {
    const supabase = await createClient();


    // 1. Fetch Data
    const { data: metricsData, error: dbError } = await supabase.rpc('get_weekly_agency_metrics', {
        days_lookback: params.lookbackDays
    });

    if (dbError) {
        console.error("DB Error fetching metrics:", dbError);
        throw new Error("Failed to fetch agency metrics");
    }

    const { metrics } = metricsData;

    // 2. Construct AI Prompt
    const systemPrompt = `
       You are the Chief Strategy Officer for a social services agency.
       Your job is to translate raw operational data into a "Board-Ready" Executive Narrative.
       
       TONE GUIDELINES:
       - Professional, confident, and outcome-oriented.
       - Do not use buzzwords like "delve" or "synergy".
       - Focus on the "So What?" (Why do these numbers matter?).
       - Be concise. The board reads this on their phones.
       
       OUTPUT FORMAT:
       Return a markdown formatted response with:
       1. **Headline**: A punchy 5-7 word summary of the period.
       2. **Executive Summary**: A 2-3 sentence paragraph.
       3. **Key Wins**: Bullet points of positive movement.
       4. **Strategic Risks**: Bullet points of areas needing attention.
    `;

    const userPrompt = `
       Analyze the following metrics for the last ${params.lookbackDays} days:

       - Total Active Cases: ${metrics.total_active_cases}
       - New Intakes: ${metrics.new_intakes} (Growth)
       - High Risk Cases (No Contact > 14 days): ${metrics.high_risk_count}
       - Compliance Health Score: ${metrics.compliance_score}%
       
       ECONOMIC IMPACT:
       - New Job Placements: ${metrics.placements_count}
       - Average Starting Wage: $${metrics.avg_wage}
       - 30-Day Retention Rate: ${metrics.retention_rate_30}%

       Generate the Executive Brief.
    `;

    try {
        // 3. Generate with Dual-Engine AI
        const reportMarkdown = await aiService.ask({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: 0.4 // Slightly creative but grounded
        });

        // 4. Log the generation for audit
        await logSystemAction({
            action_type: 'Generation',
            description: 'Generated Executive Report',
            metadata: {
                model: 'unified-ai',
                lookback: params.lookbackDays,
                metrics_snapshot: metrics
            }
        });

        return { success: true, report: reportMarkdown, metrics };

    } catch (error) {
        console.error("AI Report Generation Failed:", error);
        return { success: false, error: "Failed to generate report narrative." };
    }
}
