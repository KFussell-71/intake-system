
import { aiService } from '../src/lib/ai/UnifiedAIService';

async function verifyAI() {
    console.log("1. Starting Verification of Executive Brief Engine...");

    const mockMetrics = {
        total_active_cases: 45,
        new_intakes: 12,
        placements_count: 8,
        avg_wage: 18.50,
        retention_rate_30: 0.92,
        high_risk_count: 3,
        compliance_score: 95
    };

    console.log("2. Mock Data Prepared:", mockMetrics);

    try {
        console.log("3. Calling UnifiedAIService (Dual-Engine)...");
        const prompt = `
        Role: Chief Strategy Officer
        Task: Synthesize these weekly metrics into a 3-sentence board-ready narrative.
        Context:
        - Active Cases: ${mockMetrics.total_active_cases}
        - New Intakes: ${mockMetrics.new_intakes}
        - Placements: ${mockMetrics.placements_count}
        - Avg Wage: $${mockMetrics.avg_wage}
        - Retention (30d): ${Math.round(mockMetrics.retention_rate_30 * 100)}%
        - Compliance: ${mockMetrics.compliance_score}%
        `;

        const result = await aiService.ask({
            prompt: prompt,
            model: 'llama3', // Will fallback if needed
            temperature: 0.7
        });

        console.log("4. AI Response Received:");
        console.log("---------------------------------------------------");
        console.log(result);
        console.log("---------------------------------------------------");
        console.log("Verification SUCCESS");

    } catch (error) {
        console.error("Verification FAILED:", error);
    }
}

verifyAI();
