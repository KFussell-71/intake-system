import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { marked } from "marked";

export async function markdownToPdf(markdown: string): Promise<Buffer> {
    const htmlContent = `
  <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap');
        body {
          font-family: 'EB Garamond', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.6;
          margin: 1in;
          color: #1a1a1a;
        }
        h1 {
          font-size: 18pt;
          text-align: center;
          text-transform: uppercase;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 24px;
        }
        h2 {
          font-size: 14pt;
          border-bottom: 1px solid #333;
          margin-top: 32px;
          margin-bottom: 16px;
          text-transform: uppercase;
          background: #f8fafc;
          padding: 4px 8px;
        }
        h3 {
          font-size: 12pt;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th, td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        ul {
          margin-left: 24px;
        }
        .signature-block {
          margin-top: 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .sig-line {
          border-top: 1px solid #000;
          padding-top: 4px;
          font-size: 9pt;
          font-weight: bold;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      ${marked(markdown)}
      <div class="signature-block">
        <div>
          <div style="height: 40px;"></div>
          <div class="sig-line">Participant Signature</div>
        </div>
        <div>
          <div style="height: 40px;"></div>
          <div class="sig-line">Date</div>
        </div>
        <div style="margin-top: 20px;">
          <div style="height: 40px;"></div>
          <div class="sig-line">Employment Specialist Signature</div>
        </div>
        <div style="margin-top: 20px;">
          <div style="height: 40px;"></div>
          <div class="sig-line">Date</div>
        </div>
      </div>
    </body>
  </html>
  `;

    // Determine if we are running in a local environment or serverless
    const isLocal = process.env.NODE_ENV === 'development';

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: (chromium as any).headless !== undefined ? (chromium as any).headless : true
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
        }
    });

    await browser.close();
    // PDF is returned as Uint8Array/Buffer
    return Buffer.from(pdf);
}
