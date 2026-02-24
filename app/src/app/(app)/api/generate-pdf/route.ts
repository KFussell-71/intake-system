import { NextRequest, NextResponse } from 'next/server';
import { markdownToPdf } from '@/lib/pdf/markdownToPdf';

// Force Node.js runtime for Puppeteer
export const runtime = 'nodejs';

/**
 * POST /api/generate-pdf
 * 
 * Generates a PDF from markdown content using server-side Puppeteer.
 * Supports "Draft" mode with watermark.
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const { markdown, isDraft } = await req.json();

        if (!markdown) {
            return NextResponse.json({ error: 'Markdown content is required' }, { status: 400 });
        }

        // Generate PDF Buffer
        const pdfBuffer = await markdownToPdf(markdown, isDraft);

        // Return as PDF stream
        return new NextResponse(pdfBuffer as any as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report-${isDraft ? 'draft' : 'final'}.pdf"`,
                'Content-Length': pdfBuffer.length.toString()
            }
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        );
    }
}
