
import { runDorAgent, IntakeBundle } from '../src/lib/agents/dorAgent';
import { markdownToPdf } from '../src/lib/pdf/markdownToPdf';
import fs from 'fs';
import path from 'path';

const mockBundle: IntakeBundle = {
    client: {
        id: 'test-id',
        name: 'Kyla Stevenson',
        first_name: 'Kyla',
        last_name: 'Stevenson',
        phone: '(555) 019-2834',
        email: 'kyla.stevenson@example.com',
        consumer_id: 'C-982734',
        dob: '1995-04-12'
    },
    intake: {
        id: 'intake-1',
        intake_date: '2026-02-14',
        report_date: '2026-02-14',
        status: 'completed',
        details: {
            counselorRationale: 'Client is highly motivated and has transferable skills from caregiving. She needs transportation support but is otherwise work-ready.',
            wageGoal: '18.50',
            readinessScale: '9',
            barriers: 'Reliable transportation is currently a barrier; vehicle inoperable.',
            education: 'High School Diploma (2013)'
        },
        employment_specialist: 'Jane Doe'
    },
    documents: [],
    employment_history: [
        { id: '1', job_title: 'Care Giver', employer: 'Sunny Vale Home Health', start_date: '2022', end_date: '2025' },
        { id: '2', job_title: 'Cashier', employer: 'Grocery Outlet', start_date: '2020', end_date: '2022' }
    ],
    isp_goals: [
        { id: '1', goal_type: 'Obtain Employment', status: 'Active', target_date: '2026-03-14', notes: 'Full time position in Healthcare or Retail' }
    ],
    supportive_services: [
        { id: '1', service_type: 'Transportation', description: 'Gas card or bus pass', status: 'Approved' },
        { id: '2', service_type: 'Interview Clothing', description: 'Voucher for work attire', status: 'Pending' }
    ],
    follow_up: {
        next_meeting_date: '2026-02-21',
        notes: 'Review job applications'
    }
};

async function generateSample() {
    console.log('1. Generating Report Content (Agent)...');
    try {
        // This will likely trigger the mock fallback in your environment if Ollama is down/no model
        // which is perfect because we want to see the FORMAT.
        const markdown = await runDorAgent(mockBundle);

        console.log('2. Converting to PDF...');
        const pdfBuffer = await markdownToPdf(markdown, false); // isDraft = false for official look

        const outputPath = path.resolve(process.cwd(), 'dor_report_sample.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log(`3. Success! PDF saved to: ${outputPath}`);
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

generateSample();
