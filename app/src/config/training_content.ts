import { BookOpen, HelpCircle, ShieldAlert, CheckCircle, Users } from 'lucide-react';

export const TRAINING_CONTENT = {
    guides: [
        {
            id: 'pulse',
            title: 'Understanding the Pulse',
            icon: 'Activity',
            description: 'How to read the real-time metrics at the top of your dashboard.',
            videoUrl: 'https://example.com/videos/pulse-tour',
            steps: [
                'The "Avg. Approval Time" shows your team\'s velocity.',
                'The "Critical Risks" card highlights AI-flagged safety issues.',
                'The "SLA Breaches" card turns RED when reports sit longer than 24 hours.'
            ]
        },
        {
            id: 'bulk-actions',
            title: 'Using Bulk Actions',
            icon: 'Layers',
            description: 'How to approve multiple reports at once.',
            videoUrl: 'https://example.com/videos/bulk-actions',
            steps: [
                'Click the checkboxes on the left side of the table.',
                'A toolbar will appear at the top of the screen.',
                'Click "Approve Selected" to batch process all checked items.',
                'Note: You cannot select reports where you have a Conflict of Interest.'
            ]
        },
        {
            id: 'conflict',
            title: 'Conflict of Interest',
            icon: 'ShieldAlert',
            description: 'Why you cannot approve your own reports.',
            steps: [
                'The system automatically detects if you are the author of a report.',
                'If "Supervisor ID" matches "Counselor ID", the Approve button is disabled.',
                'You will see a "Conflict of Interest" label instead.',
                'Another supervisor or admin must approve these cases.'
            ]
        },
        {
            id: 'ai-auto-fill',
            title: 'AI Clinical Scribe',
            icon: 'Sparkles',
            description: 'How to let AI write your reports for you.',
            steps: [
                'Navigate to the "Review" step at the end of an intake.',
                'Click the "AI Auto-Compose" button next to "Clinical Rationale".',
                'The AI will synthesize all collected data into a professional narrative.',
                'Review the draft, make any edits, and submit.'
            ]
        }
    ],
    faq: [
        {
            question: "How do I assign a client to a specific worker?",
            answer: "In the Review Queue, click the blue 'Assign' button next to any client. A dialog will appear allowing you to select a primary or secondary specialist and add any relevant notes."
        },
        {
            question: "Where did the Google Calendar go?",
            answer: "We have transitioned to a native Dashboard Calendar. This allows for better integration with client assignments and internal deadlines. You can still access your Google Calendar via the 'Open Full Calendar' link if needed."
        },
        {
            question: "Why can't I click 'Approve' on some reports?",
            answer: "This usually happens for two reasons: 1) It is your own report (Conflict of Interest), or 2) The report status has changed since you loaded the page."
        },
        {
            question: "What does the 'High Risk' badge mean?",
            answer: "The AI compares the client's self-report with the counselor's assessment. If there are significant contradictions (e.g., Client says 'No Income', Counselor says 'Employed'), it is flagged as High Risk."
        },
        {
            question: "How do I return a report for corrections?",
            answer: "Click the 'View' button to open the full report details. At the bottom, you will find a 'Return for Revision' button where you can add specific notes."
        },
        {
            question: "Can I trust the AI-generated text?",
            answer: "The AI acts as a drafter. It uses the facts you collected to write professional prose, but YOU are the author. Always review the text for accuracy before signing."
        }
    ]
};
