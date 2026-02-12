import { IntakeFormData } from '@/features/intake/intakeTypes';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Extend jsPDF with autotable types
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const getJsPDF = () => {
    // Browser and Next.js Environment
    try {
        applyPlugin(jsPDF);
    } catch (e) {
        // Plugin might already be applied or environment doesn't support it directly
        // In Next.js client side, this usually works fine.
    }
    return jsPDF;
};

export class ReportGenerator {
    static generateDORIntakeReport(formData: IntakeFormData) {
        const doc = this.getDORIntakeReportDoc(formData);
        doc.save(`DOR_Report_${(formData.clientName || 'Client').replace(/\s+/g, '_')}.pdf`);
    }

    static getDORIntakeReportDoc(formData: IntakeFormData): jsPDF {
        const JsPDFMetadata = getJsPDF();
        const doc = new JsPDFMetadata();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = 20;

        // --- Helper Functions ---
        const addText = (text: string, size: number = 10, font: string = 'times', style: string = 'normal', align: 'left' | 'center' = 'left') => {
            doc.setFont(font, style);
            doc.setFontSize(size);

            // Clean text to handle undefined/null safely
            const safeText = text || '';
            const lines = doc.splitTextToSize(safeText, contentWidth);

            if (yPos + (lines.length * size * 0.5) > 280) {
                doc.addPage();
                yPos = 20;
            }

            if (align === 'center') {
                doc.text(lines, pageWidth / 2, yPos, { align: 'center' });
            } else {
                doc.text(lines, margin, yPos);
            }
            // Approximate line height calculation (font size / 2 roughly in mm usually works for spacing)
            // But we'll use a fixed multiplier for simplicity
            yPos += (lines.length * (size * 0.4)) + 2;
        };

        const addSection = (num: number, title: string, content: string | string[]) => {
            doc.setFont('times', 'bold'); // Ensure bold for title
            doc.setFontSize(11);

            // Check page break for Title
            if (yPos > 270) { doc.addPage(); yPos = 20; }

            doc.text(`${num}. ${title}`, margin, yPos);
            yPos += 6;

            doc.setFont('times', 'normal');
            doc.setFontSize(11);

            if (Array.isArray(content)) {
                content.forEach(line => {
                    const safeLine = line || '';
                    const bulletLines = doc.splitTextToSize(`• ${safeLine}`, contentWidth - 5);
                    if (yPos + (bulletLines.length * 5) > 280) { doc.addPage(); yPos = 20; }
                    doc.text(bulletLines, margin + 5, yPos);
                    yPos += (bulletLines.length * 5) + 1;
                });
            } else {
                const safeContent = content || 'N/A';
                const textLines = doc.splitTextToSize(safeContent, contentWidth - 5);
                if (yPos + (textLines.length * 5) > 280) { doc.addPage(); yPos = 20; }
                doc.text(textLines, margin + 5, yPos);
                yPos += (textLines.length * 5) + 1;
            }
            yPos += 4; // Section spacing
        };

        // --- Header ---
        addText("New Beginnings Outreach Report", 16, "times", "bold", "center");
        addText("ES – Intake/Individual Service Plan", 14, "times", "bold", "center");
        yPos += 10;

        // --- Meta Data ---
        addText(`Participant Employment Services Intake Report`, 11, "times", "bold");
        addText(`Participant Name: ${formData.clientName}`, 11);
        addText(`Report Date: ${new Date().toLocaleDateString()}`, 11);
        addText(`Report Prepared By: Intake Specialist`, 11);
        yPos += 10;

        // --- Overview ---
        addText("Overview of Intake Process", 12, "times", "bold");
        const overviewText = `Participant ${formData.clientName} successfully completed the Employment Services Intake on ${new Date().toLocaleDateString()}. The intake process was designed to assess their current employment situation, review relevant documentation, and develop an Individual Service Plan (ISP) tailored to their job search needs and employment goals.`;
        addText(overviewText, 11);
        yPos += 10;

        // --- 16-Point Summary ---
        addText("Summary of Completed Intake Services", 12, "times", "bold");

        addSection(1, "Intake Completion Date:", [
            `Date: ${new Date().toLocaleDateString()}`,
            "The intake process was initiated and completed, during which the participant's background, employment history, and current needs were thoroughly reviewed."
        ]);

        addSection(2, "Employment Goal (30-Day Focus)",
            `${formData.clientName} would like to obtain employment within 30 days.`
        );

        addSection(3, "Desired Job Titles:",
            `${formData.desiredJobTitles || 'Entry level positions'}.`
        );

        addSection(4, "Industry Preference:",
            `${formData.employmentGoals || 'General Employment'}.`
        );

        addSection(5, "Target Pay Range:",
            `${formData.clientName} would like to make a minimum of $20.00 per hour (or prevailing wage).`
        );

        addSection(6, "Skills & Experience:",
            `${formData.keyStrengths || 'Customer service, labor, and general support skills.'}`
        );

        addSection(7, "Trainings/School:",
            `${formData.educationGoals || 'High School Diploma / General Education.'}`
        );

        addSection(8, "Transferrable Skills:",
            "Customer Service, Leadership, Time Management, Communication, Problem Solving and Safety Awareness."
        );

        addSection(9, "Barriers to Employment:",
            formData.barriers && formData.barriers.length > 0
                ? formData.barriers.join(', ') + ". (See Conclusion for mitigation plan)."
                : "None explicitly reported during intake."
        );

        addSection(10, "30 Day Action Plan:",
            `${formData.clientName} will take part in the Intake, Job Preparation Classes, and Job Search and have access to the NBO Job Developer.`
        );

        const serviceList = [
            `${formData.clientName} states they need the following services:`,
            ...(formData.transportationAssistance ? ['Transportation Assistance (gas/pass)'] : []),
            ...(formData.childcareAssistance ? ['Childcare Assistance'] : []),
            ...(formData.housingAssistance ? ['Housing Stability Support'] : []),
        ];
        if (!formData.transportationAssistance && !formData.childcareAssistance && !formData.housingAssistance) {
            serviceList.push('None stated at this time.');
        }

        addSection(11, "Support Services Needed:", serviceList);

        addSection(12, "Weekly Job Search Commitment:", [
            `${formData.clientName} will:`,
            "Apply to up to 25 jobs per week",
            "Attend the job preparation classes",
            "Meet with job developer weekly or as many times as needed"
        ]);

        addSection(13, "Preferred Contact Method:",
            `${formData.clientName} requests to be contacted via: Phone, Email, and Text.`
        );

        addSection(14, "Participant Strengths & Motivation:",
            `${formData.clientName}'s reported strengths include: ${formData.keyStrengths || 'Resilience and willingness to learn'}.`
        );

        addSection(15, "What helps you stay motivated:",
            `Family and financial stability.`
        );

        addSection(16, "Readiness to Work:",
            `${formData.clientName} states that on a scale from 1-10 they are work ready at a ${formData.readinessScale || '10'}!!`
        );

        yPos += 5;

        // --- Conclusion (Merged Narrative) ---
        addText("Conclusion", 12, "times", "bold");

        // Merge Rationale + Notes
        const conclusionText = `${formData.clinicalRationale || ''}\n\n${formData.notes || ''}`.trim();
        const fallbackConclusion = "The participant has completed the intake process and demonstrated readiness to engage in employment services. We have reviewed their goals and barriers, and they are cleared to begin the job search phase immediately.";

        addText(conclusionText || fallbackConclusion, 11);

        // --- Signatures ---
        yPos += 20; // Space for signatures
        if (yPos > 250) { doc.addPage(); yPos = 40; }

        addText("_________________________________", 11);
        addText("Intake Specialist", 11, "times", "bold");
        addText("New Beginning Outreach", 11);

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Generated by New Beginning Platform on ${new Date().toLocaleDateString()} - Confidential`,
                margin,
                285
            );
        }

        return doc;
    }
}
