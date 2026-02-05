"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { IntakeFormData } from "@/features/intake/types/intake";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNarrativeDraft(data: IntakeFormData, type: 'rationale' | 'notes') {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing API Key");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `
        You are a Senior Clinical Intake Specialist at New Beginning Outreach.
        Your goal is to take raw client data and synthesize it into professional, objective, and supportive clinical prose for a state-submittable report.
        
        WRITING STYLE:
        - Third-person narrative (e.g., "The participant states...", "It is clinically indicated that...")
        - Professional social work tone.
        - Detailed but concise paragraphs.
        - NO placeholders like [Name]. Use "${data.clientName || 'The participant'}".
    `;

    const userPrompt = type === 'rationale'
        ? `
            Based on the following data, write a 1-paragraph professional "Clinical Rationale" for this client's eligibility and program placement.
            Focus on their strengths, employment goals, and how they will overcome their identified barriers.
            
            CLIENT DATA:
            - Name: ${data.clientName}
            - Goals: ${data.employmentGoals}
            - Industry: ${data.desiredJobTitles}
            - Strengths: ${data.keyStrengths}
            - Barriers: ${data.barriers?.join(', ') || 'None identified'}
            - Medical/Psych Flags: ${data.medicalEvalNeeded ? 'Medical evaluation needed' : ''} ${data.psychEvalNeeded ? 'Psych evaluation needed' : ''}
            
            OUTPUT: One paragraph of professional clinical rationale. No preamble.
        `
        : `
            Based on the following data, write a 1-paragraph "Staff Observation & Technical Notes" summary.
            Summarize the intake process, the client's engagement level, and the technical next steps for documentation (e.g. Master App, IDs).
            
            CLIENT DATA:
            - Readiness Scale: ${data.readinessScale}/10
            - Master App Complete: ${data.masterAppComplete ? 'Yes' : 'No'}
            - Resume Status: ${data.resumeComplete ? 'Finished' : 'In Progress'}
            - Referral Source: ${data.referralSource}
            
            OUTPUT: One paragraph of staff observations. No preamble.
        `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.7 }
        });

        return result.response.text().trim();
    } catch (error) {
        console.error("AI Draft Generation Error:", error);
        throw new Error("AI failed to generate draft");
    }
}
