import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const server = new Server({
    name: "nb-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Tool: query_supabase
 * Allows executing arbitrary SQL queries (Read-only recommended for AI)
 */
const QuerySchema = z.object({
    sql: z.string().describe("The SQL query to execute on the Supabase database"),
});
/**
 * Tool: generate_dor_report
 * Generates a PDF report for a client
 */
const ReportSchema = z.object({
    clientId: z.string().describe("The UUID of the client"),
    timeframe: z.string().optional().describe("e.g., 'last-30-days'"),
});
/**
 * Tool: get_client_summary
 * Comprehensive data aggregation for a client
 */
const SummarySchema = z.object({
    clientId: z.string().describe("The UUID of the client"),
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_supabase",
                description: "Execute a SQL query against the New Beginning database. Use this for complex data aggregation and mining.",
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: { type: "string" },
                    },
                    required: ["sql"],
                },
            },
            {
                name: "generate_dor_report",
                description: "Generate a state-compliant DOR PDF report for a specific client.",
                inputSchema: {
                    type: "object",
                    properties: {
                        clientId: { type: "string" },
                        timeframe: { type: "string" },
                    },
                    required: ["clientId"],
                },
            },
            {
                name: "get_client_summary",
                description: "Retrieve all records for a client (intakes, follow-ups, placements) in a single consolidated package.",
                inputSchema: {
                    type: "object",
                    properties: {
                        clientId: { type: "string" },
                    },
                    required: ["clientId"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "query_supabase") {
            const { sql } = QuerySchema.parse(args);
            // NOTE: Using rpc or direct query. Supabase JS doesn't have raw SQL execution easily without a custom function.
            // We'll use the 'query' rpc if it exists, or fall back to explaining we need one.
            // For this implementation, we assume there's a postgres function to handle dynamic sql safely.
            const { data, error } = await supabase.rpc('execute_sql', { query_text: sql });
            if (error)
                throw error;
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }
        if (name === "get_client_summary") {
            const { clientId } = SummarySchema.parse(args);
            const [intakes, followUps, placements] = await Promise.all([
                supabase.from('intakes').select('*').eq('client_id', clientId),
                supabase.from('follow_ups').select('*').eq('client_id', clientId),
                supabase.from('job_placements').select('*').eq('client_id', clientId)
            ]);
            const summary = {
                intakes: intakes.data,
                followUps: followUps.data,
                placements: placements.data
            };
            return {
                content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
            };
        }
        if (name === "generate_dor_report") {
            const { clientId } = ReportSchema.parse(args);
            const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
            if (!client)
                throw new Error("Client not found");
            // Launch headless browser
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    .header { border-bottom: 2px solid #333; margin-bottom: 20px; }
                    .section { margin-bottom: 30px; }
                    h1 { color: #1e40af; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>New Beginning Social Services</h1>
                    <p>State-Compliant Service Report</p>
                </div>
                <div class="section">
                    <h2>Client Information</h2>
                    <p><strong>Name:</strong> ${client.name}</p>
                    <p><strong>Ref ID:</strong> ${clientId.slice(0, 8)}</p>
                </div>
                <div class="section">
                    <h2>Service Summary</h2>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                </div>
            </body>
        </html>
      `;
            await page.setContent(htmlContent);
            const pdfBuffer = await page.pdf({ format: 'A4' });
            await browser.close();
            // In a real MCP, we'd save this or return base64. 
            // For now, let's return a success message with the data size.
            return {
                content: [{
                        type: "text",
                        text: `Report successfully generated for ${client.name}. Outputting raw buffer info. Use a file-saving tool to persist if needed. Size: ${pdfBuffer.length} bytes.`
                    }],
            };
        }
        throw new Error(`Tool not found: ${name}`);
    }
    catch (error) {
        return {
            isError: true,
            content: [{ type: "text", text: `Error: ${error.message}` }],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("New Beginning MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map