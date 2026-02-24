import { IntakeBundle } from "@/lib/agents/dorAgent";

export interface ValidationResult {
    valid: boolean;
    missing: string[];
}

/**
 * Validates an intake bundle against mandatory DOR fields before report generation.
 * This is the 'Compliance Gate' that prevents incomplete records from being submitted.
 */
export function validateIntakeBundle(bundle: IntakeBundle): ValidationResult {
    const missing: string[] = [];

    // 1. Client Identity
    if (!bundle.client?.name) missing.push("Client Full Name");
    if (!bundle.client?.email && !bundle.client?.phone) missing.push("Client Contact Info (Email or Phone)");

    // 2. Intake Timing
    if (!bundle.intake?.report_date) missing.push("Report/Intake Date");

    // 3. ISP Data (Found in the JSONB details or isp_goals)
    const details = bundle.intake?.details || {};

    if (!details.employmentGoals && !bundle.isp_goals?.length) {
        missing.push("Employment Goals / ISP Focus");
    }

    if (!details.ispGoals || (Array.isArray(details.ispGoals) && details.ispGoals.length === 0)) {
        missing.push("30-Day Action Plan (ispGoals)");
    }

    // 4. Critical Professional Data
    if (!details.desiredJobTitles) missing.push("Desired Job Title(s)");
    if (!details.workExperienceSummary) missing.push("Work Experience Summary");

    return {
        valid: missing.length === 0,
        missing
    };
}
