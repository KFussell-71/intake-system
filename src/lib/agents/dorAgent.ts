import { createClient } from '@supabase/supabase-js';

// Define the interface for the Intake Bundle we get from RPC
export interface IntakeBundle {
    client: {
        id: string;
        name: string;
        first_name: string;
        last_name: string;
        phone?: string;
        email?: string;
        consumer_id?: string;
        dob?: string;
    };
    intake: {
        id: string;
        intake_date: string;
        report_date: string;
        status: string;
        details: any; // The full JSONB data from the intake form
        employment_specialist?: string;
    };
    documents: {
        id: string;
        name: string;
        type: string;
        status: string;
        reviewed_date?: string;
    }[];
    employment_history: {
        id: string;
        job_title: string;
        employer: string;
        start_date?: string;
        end_date?: string;
        notes?: string;
    }[];
    isp_goals: {
        id: string;
        goal_type: string;
        target_date?: string;
        status: string;
        notes?: string;
    }[];
    supportive_services: {
        id: string;
        service_type: string;
        description: string;
        status: string;
    }[];
    follow_up: {
        next_meeting_date?: string;
        notes?: string;
    };
}

export async function runDorAgent(data: IntakeBundle): Promise<string> {
    const LOCKED_SYSTEM_PROMPT = `
# SYSTEM ROLE:
You are an AI Employment Specialist acting on behalf of the California Department of Rehabilitation (DOR).
Your sole purpose is to generate professional, compliant, objective Employment Services Intake Reports that meet California DOR Employment Services documentation standards.

# RULES:
- **Use ONLY provided data.** Do not introduce diagnoses, assumptions, or external interpretations.
- **Tone**: Use third-person, professional, and objective social work language (e.g., "The participant reports...", "Observations indicate...").
- **Missing Data**: If specific information is missing, clearly label the section or field as "Not Provided" or "Pending Review". **NEVER FABRICATE INFORMATION.**
- **Structure**: Follow the exact 22-section sequence defined in the report layout.
- **Fidelity**: Ensure all checkboxes, goals, and target dates from the structured data are explicitly represented.

# AUTHORITATIVE STRUCTURE (THE 22 SECTIONS):
1. Participant Employment Services Intake Report
2. Participant Name
3. Report Date
4. Report Prepared By: James Jones, Employment Specialist
5. Overview of Intake Process
6. Summary of Completed Intake Services
7. Employment Goal (30-Day Focus)
8. Desired Job Titles
9. Industry Preference
10. Target Pay Range
11. Skills & Experience
12. Trainings/School
13. Transferrable Skills
14. Barriers to Employment
15. 30 Day Action Plan
16. Support Services Needed
17. Weekly Job Search Commitment
18. Preferred Contact Method
19. Participants Strengths & Motivation
20. Readiness to Work
21. Conclusion
22. Signature Block

# DATA MAPPING PROTOCOL:
- **Primary Source**: Use the flat keys in CLIENT INFORMATION, EMPLOYMENT & SKILLS DATA, and ISP & ACTION PLAN.
- **Secondary/Custom Source**: If a field (like desiredJobTitles, workExperienceSummary, ispGoals, or preferredContactMethods) is not in the flat keys, pull it from INTAKE METADATA.details.
- **Specific Mapping**:
    - 30 Day Action Plan (Section 15): Create a clear Markdown table using intake.details.ispGoals.
    - Skills & Experience (Section 11): Use intake.details.workExperienceSummary.
    - Barriers (Section 14): List selected items from intake.details.barriers.
`;

    const userPrompt = `
    Generate a State-Submittable Intake Report for ${data.client.name} based on the following authoritative bundle:
    
    CLIENT INFORMATION:
    ${JSON.stringify(data.client, null, 2)}
    
    INTAKE METADATA:
    ${JSON.stringify(data.intake, null, 2)}
    
    VERIFIED DOCUMENTS:
    ${JSON.stringify(data.documents, null, 2)}
    
    EMPLOYMENT & SKILLS DATA:
    ${JSON.stringify(data.employment_history, null, 2)}
    
    ISP & ACTION PLAN (Live Goals):
    ${JSON.stringify(data.isp_goals, null, 2)}
    
    SUPPORT SERVICES:
    ${JSON.stringify(data.supportive_services, null, 2)}
    
    FOLLOW UP:
    ${JSON.stringify(data.follow_up, null, 2)}
    
    OUTPUT: Structured Markdown matching DOR.ES template exactly. No preamble.
  `;

    // Determine which provider to use. Ideally this config comes from environment.
    // We'll use a mocked response if no key is present to ensure build passes.
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDXQGREnONQOG6NYdoB--fkUX6wNq_ttqU'; // Fallback to provided key if env missing (for demo)

    if (!apiKey) {
        console.warn("No GEMINI_API_KEY found. Returning mock report.");
        return generateMockReport(data);
    }

    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: LOCKED_SYSTEM_PROMPT },
                        { text: userPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
            },
        });

        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Agent execution failed:", error);
        throw error;
    }
}

function generateMockReport(data: IntakeBundle): string {
    return `
# EMPLOYMENT SERVICES INTAKE REPORT

**Client Name:** ${data.client.first_name} ${data.client.last_name}
**Intake Date:** ${data.intake.report_date}

## 1. Overview
Intake was conducted on ${data.intake.report_date}.

## 2. Documents Reviewed
- Referral: ${data.documents.find(d => d.type === 'referral')?.status || 'Pending'}
- IPE: ${data.documents.find(d => d.type === 'ipe')?.status || 'Pending'}

## 3. Employment Goals
${data.isp_goals.map(g => `- ${g.goal_type} by ${g.target_date}`).join('\n')}

## 4. Conclusion
Follow up scheduled for ${data.follow_up.next_meeting_date || 'TBD'}.
  `;
}
