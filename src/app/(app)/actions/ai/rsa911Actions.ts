
import { UnifiedAIService } from '@/lib/ai/UnifiedAIService';
import { IntakeFormData } from '@/features/intake/intakeTypes';

const aiService = new UnifiedAIService();

export async function suggestRSA911Codes(intakeData: Partial<IntakeFormData>) {
    // 1. Construct a prompt based on clinical/medical/vocational data
    const context = `
    Client Notes: ${intakeData.notes || 'None'}
    Medical Condition: ${intakeData.medicalConditionDescription || 'None'}
    Barriers: ${intakeData.barriers?.join(', ') || 'None'}
    Education: ${intakeData.educationLevel || 'Unknown'}
    
    Task: Based on the RSA-911 data standards, suggest the appropriate codes for:
    1. Primary Disability Impact (Mobility, Communication, Self-Care, etc.)
    2. Most Significant Disability (Priority Category 1, 2, or 3)
    3. Recommended VR Services (Counseling, Restoration, Training, etc.)
    
    Output JSON only: { "primaryDisability": string, "priorityCategory": string, "suggestedServices": string[] }
    `;

    // 2. Call AI
    try {
        const response = await aiService.ask({
            prompt: context,
            system: "You are an expert VR Counselor and RSA-911 Compliance Officer.",
            temperature: 0.2
        });

        // 3. Parse and return
        // Note: Real implementation needs robust JSON parsing/cleaning
        return { success: true, suggestions: response };
    } catch (error) {
        return { success: false, error: 'AI unavailable' };
    }
}
