// src/lib/pdf/generatePDF.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generatePDF(markdown: string): Promise<Blob> {
    // NOTE: This currently relies on Client-Side HTML rendering logic.
    // In a full implementation, we'd parser Markdown to HTML, then use html2canvas/jsPDF.
    // Since this is a library file, we'll assume it runs where 'document' exists (Client)
    // OR we implement a server-side simple text PDF if running in Node.

    if (typeof window === 'undefined') {
        throw new Error("generatePDF currently supports client-side execution only.");
    }

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.width = '8.5in'; // Letter width
    container.style.padding = '1in';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.className = 'dor-report'; // hook for CSS

    // Basic Markdown -> HTML (replace with a real parser if available)
    container.innerHTML = simpleMarkdownToHtml(markdown);

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2, // Retain quality
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'pt', 'letter');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        return pdf.output('blob');

    } finally {
        document.body.removeChild(container);
    }
}

function simpleMarkdownToHtml(md: string): string {
    // A very basic parser for the demo - replace with `marked` or similar for production
    return md
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>') // Naive list
        .replace(/\n\n/gim, '<p></p>')
        .replace(/\n/gim, '<br />');
}
