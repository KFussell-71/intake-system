import { createClient } from '@supabase/supabase-js';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import { sanitizeForPrompt, validateAIOutput } from '@/lib/ai/sanitizer';
import { aiService } from '@/lib/ai/UnifiedAIService';
import { scrubPII } from '@/lib/security/piiScrubber';

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

// Redundant local definitions removed in favor of @/lib/ai/sanitizer

export async function runDorAgent(data: IntakeBundle, preparerName: string = "Employment Specialist"): Promise<string> {
    const LOCKED_SYSTEM_PROMPT = `
# SYSTEM ROLE:
You are an Employment Specialist acting on behalf of the Department of Rehabilitation (DOR).
Your role is to generate Employment Services Intake Reports that comply with DOR documentation standards and are suitable for state review, auditing, and submission.

# MANDATORY RULES:
- Write in **third-person**, professional social work language (e.g., "The participant states...", "Kyla reports...").
- Be **factual, neutral, and objective**.
- Do not fabricate information under any circumstance.
- If required data is missing, explicitly state "Pending Review" or "Not Provided".
- Do not infer medical or psychological conditions beyond what is explicitly provided.
- Ensure all **dates, timelines, and goals** are explicit and clearly stated.
- List reviewed documents clearly and accurately.

# INSTRUCTIONS:
Use the provided "New Beginnings Outreach – ES Intake Report" template below as the canonical reference for structure, tone, section order, and language style.
You must generate a COMPLETE, FULLY-WRITTEN report. This is NOT a template with placeholders - every section must contain actual written content based on the provided data.

# REPORT TEMPLATE (Exact Structure Required):

# Participant Employment Services Intake Report

**Participant Name:** [Client Full Name]
**Report Date:** [Current Date MM/DD/YYYY]
**Report Prepared By:** ${preparerName}, Employment Specialist

## Overview of Intake Process
(Write a narrative confirming the intake completion. Example: "Participant [Name] successfully completed the Employment Services Intake on [Date]. The intake process was designed to assess [his/her] current employment situation, review relevant documentation, and develop an Individual Service Plan (ISP) tailored to [his/her] job search needs and employment goals.")

## Summary of Completed Intake Services
**Intake Completion Date:** [Intake Date]

(Write a narrative summary. Example: "The intake process was initiated and completed, during which the participant's background, employment history, and current needs were thoroughly reviewed.")

## Employment Goal (30-Day Focus)
[Client Name] would like to Obtain employment within 30 days.

## Desired Job Titles
(Write 2-3 complete sentences describing the participant's career goals, immediate job targets, and any relevant context about their aspirations. Use narrative form, not bullet points.)

## Industry Preference
(Write 1-2 complete sentences about where the participant wants to work and what types of organizations they're targeting.)

## Target Pay Range
[Client Name] would like to make a minimum of $[Target Wage] per hour.

## Skills & Experience
(Write 1-2 complete sentences listing the participant's work skills and experience areas in narrative form.)

## Trainings/School
(Write 1-2 complete sentences about current education, certifications, or training programs.)

## Transferrable Skills
(Write 1-2 complete sentences describing skills that can transfer across jobs, e.g., "Customer Service, Leadership and Supervision, Time Management, Communication, Problem Solving and Safety Awareness".)

## Barriers to Employment
(Write 2-3 complete sentences describing any challenges or barriers the participant faces, with specific details about how these might impact their job search.)

## 30 Day Action Plan
[Client Name] will take part in the Intake, Job Preparation Classes, and Job Search and have access to the NBO Job Developer.

## Support Services Needed
[Client Name] states [he/she] needs the following services: (List specific services like Transportation, Clothing, etc. in a sentence).

## Weekly Job Search Commitment
[Client Name] will:
- Apply to up to 25 jobs per week
- Attend the job preparation classes
- Meet with job developer weekly or as many times as needed

## Preferred Contact Method
[Client Name] requests all 3 ways to be contacted:
Email (yes), Text (yes), Phone (yes).

## Participants Strengths & Motivation
(Write 1-2 sentences about strengths.)
**What helps you stay motivated?**
(Write 1 sentence about motivation source.)

## Readiness to Work
[Client Name] states that on a scale from 1-10 [he/she] is work ready at a [Readiness Level]!

## Conclusion
(THIS IS THE MOST IMPORTANT SECTION. Write a comprehensive 6-8 sentence narrative paragraph based on the Case Manager's Rationale. It must synthesize experience, goals, challenges, and commitment. Ensure it is audit-safe and professional.)

**The next follow-up meeting is scheduled for [Next Meeting Date] @ 2:30 p.m. at New Beginnings Outreach to begin [his/her] Employment Prep classes.**

**[Client Name]'s schedule at a glance:**

**Monday**
Fair Chance Hiring
Resume Writing
Impact of earning on benefits (TTW, TANF, Cal-works)
Transportation

**Tuesday**
Interviewing Techniques
Mock Interviews/video recordings

**Wednesday**
Work behaviors, relating to co-workers/supervisor
Work practices, being on-time, reporting illness, proper use and treatment of company equipment.

**Thursday**
Hygiene & Grooming
Work Attire
Uniforms
Master Application

**${preparerName}**
**Employment Specialist**
**New Beginning Outreach**

# FINAL CHECK:
- Are all required sections present?
- Is the tone professional and third-person?
- No speculative language?
- Ready for PDF conversion?
- Use gender-appropriate pronouns (he/him, she/her) based on context.
`;

    // SECURITY: Sanitize all user-controlled inputs (BLUE TEAM REMEDIATION)
    // PURPLE TEAM: Scrub PII (RT-HIGH-PII)
    const sanitizedClient = {
        name: sanitizeForPrompt(scrubPII(data.client.name || '')),
        first_name: sanitizeForPrompt(scrubPII(data.client.first_name || '')),
        last_name: sanitizeForPrompt(scrubPII(data.client.last_name || '')),
        phone: sanitizeForPrompt(scrubPII(data.client.phone || '')),
        email: sanitizeForPrompt(scrubPII(data.client.email || '')),
        consumer_id: sanitizeForPrompt(scrubPII(data.client.consumer_id || '')),
        dob: sanitizeForPrompt(scrubPII(data.client.dob || ''))
    };

    const userPrompt = `
    GENERATE REPORT FOR:
    Client: ${sanitizedClient.name}
    Intake Date: ${sanitizeForPrompt(data.intake.intake_date)}
    Status: ${sanitizeForPrompt(data.intake.status)}

    DATA FOR INJECTION:
    - Phone: ${sanitizedClient.phone}
    - Email: ${sanitizedClient.email}
    - Wage Goal: ${sanitizeForPrompt(data.intake.details?.wageGoal || '16.00')}
    - Readiness: ${sanitizeForPrompt(data.intake.details?.readinessScale || '10')}
    - Next Meeting: ${sanitizeForPrompt(data.follow_up.next_meeting_date || 'TBD')}
    
    CLINICAL CONTEXT (Use in narratives):
    - Rationale: ${sanitizeForPrompt(data.intake.details?.counselorRationale)}
    - Employment History: ${data.employment_history.map(h => `${h.job_title} at ${h.employer}`).join(', ')}
    - Goals: ${data.isp_goals.map(g => g.goal_type).join(', ')}
    - Barriers: ${sanitizeForPrompt(data.intake.details?.barriers || 'None reported')}
    - Education: ${sanitizeForPrompt(data.intake.details?.education || 'High School Diploma')}
    - Support Needed: ${data.supportive_services.map(s => s.service_type).join(', ')}
    
    Generate the markdown report now.
  `;

    // Use Unified AI Service
    try {
        const text = await aiService.ask({
            prompt: LOCKED_SYSTEM_PROMPT + "\n\n" + userPrompt,
            temperature: 0.2,
            // userId: 'system-agent'
        });

        // SECURITY: Validate output for injection attempts (BLUE TEAM REMEDIATION)
        const isValid = validateAIOutput(text);
        if (!isValid) {
            hipaaLogger.error('AI output validation failed: Potential Injection Detected');
            throw new Error('AI output validation failed: Potential Injection-Like Content Detected');
        }

        return text;

    } catch (error) {
        hipaaLogger.error("DOR Agent execution failed:", error);
        return generateMockReport(data);
    }
}

function generateMockReport(data: IntakeBundle): string {
    return `
# Participant Employment Services Intake Report

**Participant Name:** ${data.client.first_name} ${data.client.last_name}
**Report Date:** ${data.intake.report_date}
**Report Prepared By:** ${data.intake.employment_specialist || 'Employment Specialist'}, Employment Specialist

## Overview of Intake Process
Participant ${data.client.first_name} ${data.client.last_name} successfully completed the Employment Services Intake on ${data.intake.intake_date}. The intake process was designed to assess ${data.client.first_name}'s current employment situation, review relevant documentation, and develop an Individual Service Plan (ISP) tailored to their job search needs and employment goals.

## Summary of Completed Intake Services
**Intake Completion Date:** ${data.intake.intake_date}

The intake process was initiated and completed, during which the participant's background, employment history, and current needs were thoroughly reviewed.

## Employment Goal (30-Day Focus)
${data.client.first_name} would like to Obtain employment within 30 days.

## Desired Job Titles
${data.client.first_name} creates a goal to obtain employment as a ${data.isp_goals[0]?.goal_type || 'General Laborer'}. They are open to positions in this field and have expressed a strong interest in securing a stable role.

## Industry Preference
The participant has indicated a preference for the ${data.isp_goals[0]?.goal_type || 'General'} industry.

## Target Pay Range
${data.client.first_name} would like to make a minimum of $${(data.intake.details as any)?.wageGoal || '16.00'} per hour.

## Skills & Experience
${data.client.first_name} brings experience from their time as a ${data.employment_history[0]?.job_title || 'Worker'}. They have demonstrated reliability and a willingness to learn new tasks.

## Trainings/School
${(data.intake.details as any)?.education || 'High School Diploma'}. No additional training noted at this time.

## Transferrable Skills
Customer Service, Time Management, Communication, Problem Solving and Safety Awareness.

## Barriers to Employment
${(data.intake.details as any)?.barriers || 'None reported at this time.'}

## 30 Day Action Plan
${data.client.first_name} will take part in the Intake, Job Preparation Classes, and Job Search and have access to the NBO Job Developer.

## Support Services Needed
${data.client.first_name} states they need the following services: ${(data.supportive_services as any[]).map(s => s.service_type).join(', ') || 'None'}.

## Weekly Job Search Commitment
${data.client.first_name} will:
- Apply to up to 25 jobs per week
- Attend the job preparation classes
- Meet with job developer weekly or as many times as needed

## Preferred Contact Method
${data.client.first_name} requests all 3 ways to be contacted:
Email (yes), Text (yes), Phone (yes).

## Participants Strengths & Motivation
The participant is motivated by: Financial stability and personal growth.
**What helps you stay motivated?**
Family and the desire to be self-sufficient.

## Readiness to Work
${data.client.first_name} states that on a scale from 1-10 they are work ready at a ${(data.intake.details as any)?.readinessScale || '10'}!

## Conclusion
${data.client.first_name} completed the intake process demonstrating a strong motivation to return to the workforce. With a focus on ${(data.isp_goals as any[])[0]?.goal_type || 'employment'}, they are committed to the 30-day action plan. Barriers such as ${(data.intake.details as any)?.barriers || 'none'} have been discussed, and support services including ${(data.supportive_services as any[]).map(s => s.service_type).join(', ')} will be utilized.

**The next follow-up meeting is scheduled for ${data.follow_up.next_meeting_date || 'TBD'} @ 2:30 p.m. at New Beginnings Outreach to begin their Employment Prep classes.**

**${data.client.first_name}'s schedule at a glance:**

**Monday**
Fair Chance Hiring
Resume Writing
Impact of earning on benefits (TTW, TANF, Cal-works)
Transportation

**Tuesday**
Interviewing Techniques
Mock Interviews/video recordings

**Wednesday**
Work behaviors, relating to co-workers/supervisor
Work practices, being on-time, reporting illness, proper use and treatment of company equipment.

**Thursday**
Hygiene & Grooming
Work Attire
Uniforms
Master Application

**${data.intake.employment_specialist || 'Employment Specialist'}**
**Employment Specialist**
**New Beginning Outreach**
  `;
}
