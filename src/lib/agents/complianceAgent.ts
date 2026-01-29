import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function validateIntakeLogic(intakeData: any) {
    if (!process.env.GEMINI_API_KEY) {
        return { valid: true, issues: [] }; // Mock pass if no key
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
    You are a Logic Validator for Social Services Intake Forms.
    Analyze the following JSON data for contradictions or logical fallacies.
    
    Examples of contradictions:
    - Client says "Ready to work" (10/10) but lists "No Transportation" and "No Childcare".
    - Client says "No employment history" but lists a job ending last month.
    - Housing is "Stable" but address is "Homeless Shelter".

    Data:
    ${JSON.stringify(intakeData, null, 2)}

    Return a JSON object:
    {
        "valid": boolean,
        "issues": ["string description of issue"]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { valid: true, issues: [] };
    } catch (error) {
        console.error('Validation Error:', error);
        return { valid: true, issues: ['Validation service unavailable'] };
    }
}
