// src/lib/pdf/generatePDF.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const REQUIRED_SECTIONS = [
    "Participant Employment Services Intake Report",
    "Client Information",
    "Employment Goal",
    "Barriers to Employment",
    "30 Day Action Plan",
    "Conclusion",
    "Signature Block"
];

export async function generatePDF(markdown: string): Promise<Blob> {
    // 1. Deterministic Contract Validation
    for (const section of REQUIRED_SECTIONS) {
        if (!markdown.toLowerCase().includes(section.toLowerCase())) {
            throw new Error(`State Compliance Failure: Missing required section "${section}" in the generated report.`);
        }
    }

    if (typeof window === 'undefined') {
        throw new Error("generatePDF currently supports client-side execution only.");
    }

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.width = '8.5in';
    container.style.padding = '1in';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.backgroundColor = 'white';
    container.className = 'dor-report';

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        .dor-report {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: black;
        }
        .dor-report h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
        .dor-report h2 { font-size: 13pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .dor-report p { margin-bottom: 10px; }
        .dor-report strong { font-weight: bold; }
        .dor-report ul { margin-left: 20px; list-style-type: square; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-12 { gap: 3rem; }
        .mt-20 { margin-top: 5rem; }
        .mt-8 { margin-top: 2rem; }
        .border-t { border-top-width: 1px; }
        .border-slate-300 { border-color: #cbd5e1; }
        .border-slate-900 { border-color: #0f172a; }
        .h-px { height: 1px; }
        .bg-slate-900 { background-color: #0f172a; }
        .w-full { width: 100%; }
        .mb-2 { margin-bottom: 0.5rem; }
        .uppercase { text-transform: uppercase; }
        .font-bold { font-weight: bold; }
        .text-\[9pt\] { font-size: 9pt; }
    `;
    document.head.appendChild(style);

    container.innerHTML = simpleMarkdownToHtml(markdown);
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'pt', 'letter');
        const pdfWidth = 612;

        const imgWidth = canvas.width / 2;
        const imgHeight = canvas.height / 2;
        const ratio = pdfWidth / imgWidth;
        const finalImgWidth = pdfWidth;
        const finalImgHeight = imgHeight * ratio;

        pdf.addImage(imgData, 'JPEG', 0, 0, finalImgWidth, finalImgHeight);

        return pdf.output('blob');

    } finally {
        document.body.removeChild(container);
        document.head.removeChild(style);
    }
}

function simpleMarkdownToHtml(md: string): string {
    if (!md) return '';
    return md
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-center uppercase mb-6 tracking-tight border-b-2 border-slate-900 pb-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold border-b border-slate-900 pb-1 mt-8 mb-4 uppercase tracking-wide bg-slate-50 px-2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-4 px-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\* ([^*]+) \*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc mb-1">$1</li>')
        .replace(/<li>.*<\/li>/gim, (match) => `<ul class="my-4 border-l-2 border-slate-200 ml-4">${match}</ul>`)
        .replace(/<\/ul><ul class="my-4 border-l-2 border-slate-200 ml-4">/gim, '')
        .replace(/\n\n/gim, '<p class="mb-4 px-2"></p>')
        .replace(/\n/gim, '<br />')
        .replace(/---/gim, '<hr class="my-8 border-slate-300" />')
        .concat(`
            <div class="mt-20 pt-8 border-t border-slate-900 grid grid-cols-2 gap-12 px-2">
                <div>
                    <div class="h-px bg-slate-900 w-full mb-2"></div>
                    <p class="text-[9pt] font-bold uppercase">Participant Signature</p>
                </div>
                <div>
                    <div class="h-px bg-slate-900 w-full mb-2"></div>
                    <p class="text-[9pt] font-bold uppercase">Date</p>
                </div>
                <div class="mt-8">
                    <div class="h-px bg-slate-900 w-full mb-2"></div>
                    <p class="text-[9pt] font-bold uppercase">Employment Specialist Signature</p>
                </div>
                <div class="mt-8">
                    <div class="h-px bg-slate-900 w-full mb-2"></div>
                    <p class="text-[9pt] font-bold uppercase">Date</p>
                </div>
            </div>
        `);
}
