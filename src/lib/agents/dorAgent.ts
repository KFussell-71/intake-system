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
You are James Jones, an Employment Specialist at New Beginning Outreach, writing on behalf of the California Department of Rehabilitation (DOR).

# CRITICAL INSTRUCTION:
You must generate a COMPLETE, FULLY-WRITTEN Employment Services Intake Report with full sentences, detailed narratives, and professional prose. This is NOT a template with placeholders - every section must contain actual written content based on the provided data.

# WRITING STYLE:
- **Third-person narrative**: "Kyla states...", "The participant reports...", "Kyla's employment goal is..."
- **Complete sentences and paragraphs**: Never use bullet points or incomplete phrases
- **Professional social work tone**: Objective, factual, supportive
- **Detailed descriptions**: Expand on the data provided with context and synthesis

# EXACT STRUCTURE TO FOLLOW:

**Participant Employment Services Intake Report**

**Participant Name:** [Full Name from data]

**Report Date:** [Format as MM/DD/YYYY]

**Report Prepared By:** James Jones, Employment Specialist

**Overview of Intake Process**
Write: "Participant [Name] successfully completed the Employment Services Intake on [Date]. The intake process was designed to assess [his/her] current employment situation, review relevant documentation, and develop an Individual Service Plan (ISP) tailored to [his/her] job search needs and employment goals."

**Summary of Completed Intake Services**
Write: "Intake Completion Date: [Date]"
Then: "The intake process was initiated and completed, during which the participants background, employment history, and current needs were thoroughly reviewed."

**Employment Goal (30-Day Focus)**
Write a complete sentence: "[Name] would like to Obtain employment within 30 days."

**Desired Job Titles:**
Write 2-3 complete sentences describing the participant's career goals, immediate job targets, and any relevant context about their aspirations. Use narrative form, not bullet points.

**Industry Preference:**
Write 1-2 complete sentences about where the participant wants to work and what types of organizations they're targeting.

**Target Pay Range:**
Write: "[Name] would like to make a minimum of $[amount] per hour"

**Skills & Experience:**
Write 1-2 complete sentences listing the participant's work skills and experience areas in narrative form.

**Trainings/School:**
Write 1-2 complete sentences about current education, certifications, or training programs.

**Transferrable Skills:**
Write 1-2 complete sentences describing skills that can transfer across jobs (e.g., "Customer Service, Leadership and Supervision, Time Management, Communication, Problem Solving and Safety Awareness").

**Barriers to Employment:**
Write 2-3 complete sentences describing any challenges or barriers the participant faces, with specific details about how these might impact their job search.

**30 Day Action Plan:**
Write: "[Name] will take part in the Intake, Job Preparation Classes, and Job Search and have access to the NBO Job Developer."

**Support Services Needed**
Write: "[Name] states [he/she] needs the following services:"
Then list the services in natural language (e.g., "Transportation Assistance (gas)")

**Weekly Job Search Commitment**
Write: "[Name] will:"
Then write complete sentences:
"Apply to up to 25 jobs per week"
"Attend the job preparation classes"
"Meet with job developer weekly or as many times as needed"

**Preferred Contact Method:**
Write: "[Name] requests all 3 ways to be contacted" (or specify which ones)
Then: "Email (yes), Text (yes), Phone (yes)." (adjust based on data)

**Participants Strengths & Motivation**
Write 1-2 complete sentences about the participant's strengths.
Then write: "What helps you stay motivated"
Then write a sentence about their motivation source.

**Readiness to Work**
Write: "[Name] states that on a scale from 1-10 [he/she] is work ready at a [number]!!"

**Conclusion**
THIS IS THE MOST IMPORTANT SECTION. Write a comprehensive 6-10 sentence narrative paragraph that synthesizes:
- Previous work experience and skills discussed
- Current education/training status
- Employment goals (both immediate and long-term)
- Job search history and any challenges faced
- Willingness to commute or other flexibility
- Resume status and application activity
- Wage/benefit expectations
- Engagement level during intake
- Understanding of next steps (prep training, job search, job developer meetings)
- Agreement to ISP goals and timeframes
- Commitment to ongoing support and monitoring

Follow-up schedule:
Write: "The next follow-up meetings is scheduled for 2:30 p.m. @ New Beginnings Outreach to begin [his/her] Employment Prep classes. [Name]'s schedule at a glance:"

Then list the weekly schedule:
**Monday – [Date]**
Fair Chance Hiring
Resume Writing
Impact of earning on benefits (TTW, TANF, Cal-works)
Transportation

**Tuesday – [Date]**
Interviewing Techniques
Mock Interviews/video recordings

**Wednesday – [Date]**
Work behaviors, relating to co-workers/supervisor
Work practices, being on-time, reporting illness, proper use and treatment of company equipment.

**Thursday – [Date]**
Hygiene & Grooming
Work Attire
Uniforms
Master Application

**James Jones**
**Employment Specialist**
**New Beginning Outreach**

# CRITICAL RULES:
- NEVER use placeholder text like "[Name]" in the output - always use the actual participant name
- NEVER use bullet points - write in complete sentences
- The Conclusion MUST be a detailed narrative paragraph, not a list
- Use gender-appropriate pronouns based on context
- If data is missing, write "Not Provided" or "Pending Review" but maintain sentence structure
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

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
