"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateCaseNote(rawInput: string, type: 'SOAP' | 'DAP' | 'General', clientName: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing API Key");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast model for notes

    const systemPrompt = `
        You are an expert Social Work Case Manager scribe.
        Your goal is to take raw, unstructured shorthand notes and convert them into a professional, HIPAA-compliant progress note.
        
        FORMAT GUIDES:
        - SOAP: Subjective (Client's view), Objective (Facts/Observed), Assessment (Clinical analysis), Plan (Next steps).
        - DAP: Data (Facts/Events), Assessment (Interpretation), Plan (Next steps).
        - General: A chronological, professional summary of the event.

        RULES:
        - Use "The client" or professional voice.
        - Fix grammar and casing.
        - Remove slang unless it is a direct quote.
        - Maintain clinical neutrality.
    `;

    const userPrompt = `
        CLIENT: ${clientName}
        FORMAT: ${type}
        
        RAW INPUT:
        ${rawInput}
        
        OUTPUT:
        Write the clinical note in the requested format. Do not include markdown bolding for the *text itself*, but use bold headers (e.g., **S:**).
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.3 } // Lower temp for more factual notes
        });

        return result.response.text().trim();
    } catch (error) {
        console.error("AI Note Generation Error:", error);
        throw new Error("AI failed to generate note");
    }
}
