import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function validateIntakeLogic(intakeData: any) {
    if (!process.env.GEMINI_API_KEY) {
        return { valid: true, issues: [], score: 100 };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
    You are the "New Beginning Logic Guard" for Social Services.
    Your mission is to detect contradictions in Intake Data to prevent service delays.

    ### SCAN THESE CATEGORIES:
    1. **Capacity vs Goal**: Does the client have the means for their stated goal? 
       (e.g., Goal is trucking but no Driver's License)
    2. **Readiness vs Barriers**: Does their readiness score (1-10) match their barriers?
       (e.g., Readiness 9/10 but lists Childcare and Transportation as major blockers with no plan)
    3. **Housing vs Location**: Is the housing status consistent with the address?
       (e.g., "Stable Housing" but address is a "Homeless Shelter")
    4. **Employment vs Medical**: If they need urgent medical/psych care, is full-time immediate work logical?

    ### DATA TO ANALYZE:
    ${JSON.stringify(intakeData, null, 2)}

    ### OUTPUT SPECIFICATION:
    Return ONLY a JSON object:
    {
        "valid": boolean,
        "score": number (0-100),
        "issues": [
            {
                "severity": "critical" | "warning",
                "message": "Detailed description of the conflict",
                "fields": ["affected_field_names"]
            }
        ]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { valid: true, issues: [], score: 100 };
    } catch (error) {
        console.error('Validation Error:', error);
        return { valid: true, issues: [{ severity: 'warning', message: 'Logic engine timeout', fields: [] }], score: 99 };
    }
}
