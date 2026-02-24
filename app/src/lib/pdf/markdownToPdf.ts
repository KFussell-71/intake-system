import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export async function markdownToPdf(markdown: string, isDraft: boolean = false): Promise<Buffer> {
  // SECURITY: Sanitize HTML content before rendering (BLUE TEAM REMEDIATION: RT-SEC-002)
  // This prevents XSS and potential SSRF via Puppeteer
  const sanitizedHtml = DOMPurify.sanitize(marked(markdown) as string);

  const htmlContent = `
  <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap');
        @page {
          margin: 1in;
          size: Letter;
        }
        body {
          font-family: 'EB Garamond', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0; 
          /* Margin handled by @page or PDF options, but for printing simplicity */
        }
        h1 {
          font-size: 18pt;
          text-align: center;
          text-transform: uppercase;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 32px;
          font-weight: 700;
        }
        h2 {
          font-size: 14pt;
          border-bottom: 1px solid #cbd5e1;
          margin-top: 32px;
          margin-bottom: 16px;
          text-transform: uppercase;
          background: #f8fafc;
          padding: 6px 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        h3 {
          font-size: 12pt;
          margin-top: 24px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        p {
          margin-bottom: 12px;
          text-align: justify;
        }
        ul, ol {
          margin-bottom: 12px;
          padding-left: 24px;
        }
        li {
            margin-bottom: 4px;
        }
        .signature-block {
          margin-top: 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          page-break-inside: avoid;
        }
        .sig-line {
          border-top: 1px solid #0f172a;
          padding-top: 8px;
          font-size: 9pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .draft-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100pt;
          color: rgba(0, 0, 0, 0.08);
          font-weight: bold;
          z-index: -1;
          pointer-events: none;
          white-space: nowrap;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
      </style>
    </head>
    <body>
      ${isDraft ? '<div class="draft-watermark">DRAFT PREVIEW</div>' : ''}
      
      <div class="content">
        ${sanitizedHtml}
      </div>

      <div class="signature-block">
        <div>
          <div style="height: 50px;"></div>
          <div class="sig-line">Participant Signature</div>
        </div>
        <div>
          <div style="height: 50px;"></div>
          <div class="sig-line">Date</div>
        </div>
        <div style="margin-top: 20px;">
          <div style="height: 50px;"></div>
          <div class="sig-line">Employment Specialist Signature</div>
        </div>
        <div style="margin-top: 20px;">
          <div style="height: 50px;"></div>
          <div class="sig-line">Date</div>
        </div>
      </div>
    </body>
  </html>
  `;

  // Determine if we are running in a local environment or serverless
  const isLocal = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_IS_LOCAL === 'true';

  let browser;

  if (isLocal) {
    // Local development: Use system-installed Chrome
    // Common paths for Linux/Mac/Windows
    const localExecutablePath =
      process.env.CHROME_EXECUTABLE_PATH ||
      '/usr/bin/google-chrome' ||
      '/usr/bin/chromium-browser' ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // Fallback for Mac if needed, though we are on Linux

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: localExecutablePath,
      headless: true
    });
  } else {
    // Production/Serverless: Use @sparticuz/chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless !== undefined ? (chromium as any).headless : true
    });
  }

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    },
    displayHeaderFooter: true,
    footerTemplate: `
      <div style="font-size: 8px; color: #94a3b8; text-align: center; width: 100%; padding-bottom: 10px;">
        Generated by New Beginning Platform on ${new Date().toLocaleDateString()} - Confidential
      </div>
    `,
    headerTemplate: '<div></div>'
  });

  await browser.close();
  // PDF is returned as Uint8Array/Buffer
  return Buffer.from(pdf);
}
