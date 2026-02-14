
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface SignOptions {
    signatureBase64: string; // Data URL or Base64 string
    templateName: 'HIPAA_AuthorizationForm.pdf' | 'Notice-Of-Privacy-Practices-and-Office-Policy.pdf';
    date?: string;
    printedName?: string;
}

// Configuration for where to place signatures in each form
// Normalized 0-1 coordinates or absolute points? Let's use points for standard Letter size (612 x 792)
// This might need calibration.
const FORM_CONFIG = {
    'HIPAA_AuthorizationForm.pdf': {
        pageIndex: 0, // 0-based
        signature: { x: 100, y: 150, width: 200 }, // Bottom Left-ish
        date: { x: 400, y: 150, size: 12 },
        name: { x: 100, y: 190, size: 12 }
    },
    'Notice-Of-Privacy-Practices-and-Office-Policy.pdf': {
        pageIndex: 0, // Assuming single page or last page signature
        signature: { x: 100, y: 100, width: 200 },
        date: { x: 400, y: 100, size: 12 },
        name: { x: 100, y: 140, size: 12 }
    }
};

export async function signPdf({ signatureBase64, templateName, date, printedName }: SignOptions): Promise<Buffer> {
    const config = FORM_CONFIG[templateName];
    if (!config) throw new Error(`Unknown template: ${templateName}`);

    // 1. Load Template
    // Using process.cwd() to be safe in Next.js server context
    const templatePath = path.join(process.cwd(), 'public', 'forms', templateName);
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 2. Embed Signature Image
    // Remove header if present (data:image/png;base64,...)
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Buffer.from(base64Data, 'base64');

    // Assume PNG for now (react-signature-canvas produces PNG)
    const signatureImage = await pdfDoc.embedPng(imageBytes);

    // 3. Draw on Page
    const page = pdfDoc.getPages()[config.pageIndex];
    if (!page) throw new Error(`Form does not have page ${config.pageIndex}`);

    const { width, height } = signatureImage.scaleToFit(config.signature.width, 100); // Max height 100

    page.drawImage(signatureImage, {
        x: config.signature.x,
        y: config.signature.y,
        width,
        height,
    });

    // 4. Draw Date/Name if provided
    if (date && config.date) {
        page.drawText(date, { x: config.date.x, y: config.date.y, size: config.date.size });
    }

    if (printedName && config.name) {
        page.drawText(printedName, { x: config.name.x, y: config.name.y, size: config.name.size });
    }

    // 5. Save
    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}
