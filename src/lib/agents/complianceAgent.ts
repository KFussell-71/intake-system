import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * COMPLIANCE AGENT
 * 
 * This agent validates intake logic.
 * SECURITY: It automatically detects if it's running on the server or client.
 * - On Server: Uses the API Key directly (safe).
 * - On Client: Calls our secure internal API proxy (prevents key exposure).
 */

export async function validateIntakeLogic(intakeData: any) {
    const isServer = typeof window === 'undefined';
    
    // 1. Prepare the prompt
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
        let textResponse: string;

        if (isServer) {
            // SERVER-SIDE: Use the SDK directly
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!apiKey) {
                console.warn('[COMPLIANCE] No API key found for server-side validation.');
                return { valid: true, issues: [], score: 100 };
            }
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const result = await model.generateContent(prompt);
            textResponse = result.response.text();
        } else {
            // CLIENT-SIDE: Call our secure internal API proxy
            const response = await fetch('/api/ai/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model: 'gemini-1.5-pro' }),
            });

            if (!response.ok) {
                throw new Error(`Proxy error: ${response.statusText}`);
            }

            const data = await response.json();
            // Map Google's response format back to what we expect
            textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        // Parse the JSON from the AI response
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return { valid: true, issues: [], score: 100 };

    } catch (error) {
        console.error('[COMPLIANCE] Validation Error:', error);
        return { 
            valid: true, 
            issues: [{ 
                severity: 'warning', 
                message: 'Logic engine connection issue. Manual review suggested.', 
                fields: [] 
            }], 
            score: 99 
        };
    }
}
