
import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../src/lib/pdf/ReportGenerator';
import { IntakeFormData } from '../src/features/intake/intakeTypes';
import fs from 'fs';
import path from 'path';

// No mocks needed! Pure Node.js testing.

describe('PDF Generation Verification', () => {
    it('should generate and save a valid PDF report', () => {
        const mockData: IntakeFormData = {
            clientName: "Remediated Client",
            email: "remedy@example.com",
            phone: "555-FIXED",
            reportDate: "2023-11-22",
            ssnLastFour: "0000",
            employmentGoals: "Demonstrate Skill Usage",
            educationGoals: "Refactor for Testability",
            housingNeeds: "Stable",
            masterAppComplete: true,
            resumeComplete: true,
            class1Date: "2023-10-01",
            class2Date: "2023-10-02",
            class3Date: "2023-10-03",
            class4Date: "2023-10-04",
            // Add other data to avoid TS errors if strict
            firstName: "Remediated",
            lastName: "Client",
            dob: "1990-01-01",
            status: "draft",
            id: "test-id",
            userId: "test-user",
            createdAt: "",
            updatedAt: "",
            householdSize: 1,
            householdIncome: 0,
            publicAssistance: [],
            benefits: [],
            healthInsurance: "",
            primaryLanguage: "English",
            veteranStatus: false,
            workHistory: [],
            educationHistory: [],
            skills: [],
            certifications: [],
            barriers: [],
            legalHistory: [],
            transportation: "",
            availability: [],
            interests: [],
            references: [],
            emergencyContact: { name: "", phone: "", relation: "" }
        } as unknown as IntakeFormData;

        // 1. Generate the document object using the refactored method
        const doc = ReportGenerator.getDORIntakeReportDoc(mockData);

        // 2. Output to buffer (Node.js compatible)
        const pdfArrayBuffer = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfArrayBuffer);

        // 3. Save to disk verification
        const outputPath = path.resolve(__dirname, '../public', 'Remediated_Report_Proof.pdf');

        // Ensure directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        console.log(`SUCCESS: PDF saved to ${outputPath}`);
        console.log(`SIZE: ${buffer.length} bytes`);

        // Verify file exists and has content
        expect(fs.existsSync(outputPath)).toBe(true);
        expect(buffer.length).toBeGreaterThan(1000);
    });
});
