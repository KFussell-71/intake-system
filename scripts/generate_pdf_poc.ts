
import { ReportGenerator } from '../src/lib/pdf/ReportGenerator';
import { IntakeFormData } from '../src/features/intake/types/intake';
import fs from 'fs';
import path from 'path';

// Mock Data matching "Kyla Stevenson" example but with "Jane Doe"
const mockData = {
    clientName: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "555-0123",
    reportDate: new Date().toISOString(),
    ssnLastFour: "1234",
    employmentGoals: "Healthcare and Patient Care",
    educationGoals: "Certified Nursing Assistant (CNA)",
    desiredJobTitles: "CNA, Caregiver, Home Health Aide",
    housingNeeds: "Stable Renting",
    // housingStatus: "Renting", // Removed as per schema
    transportationAssistance: true,
    childcareAssistance: true,
    housingAssistance: false,
    keyStrengths: "Compassion, Patience, 5 years informal caregiving experience",
    barriers: ["Transportation (Car broke down)", "Childcare (Need after-school)"],
    readinessScale: 9,
    referralSource: "County CalWORKs",
    clinicalRationale: "Ms. Doe presents as a highly motivated candidate for the CNA track. She has significant informal experience and a clear career trajectory. Her barriers are logistical rather than behavioral.",
    notes: "Client was on time and professional. Recommended for immediate placement in the CNA training cohort pending childcare voucher approval.",
    // Boilerplate fields
    masterAppComplete: true,
    resumeComplete: false
};

console.log("Generating PDF...");
// We need to bypass the 'save' method which works in browser
// and instead get the arraybuffer to write to disk in Node
const doc = ReportGenerator.getDORIntakeReportDoc(mockData as IntakeFormData);
const buffer = doc.output('arraybuffer');

const outputPath = path.join(process.cwd(), 'DOR_Report_Jane_Doe_POC.pdf');
fs.writeFileSync(outputPath, Buffer.from(buffer));

console.log(`PDF successfully generated at: ${outputPath}`);
console.log("Please open this file to verify the 16-point structure.");
