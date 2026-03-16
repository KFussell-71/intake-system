"use server";

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { validateIntakeBundle } from "@/lib/validations/generationValidator";
import { runDorAgent } from "@/lib/agents/dorAgent";
import { logReportGenerated } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

/**
 * Server Action: Generate Employment Report using Prisma.
 */
export async function generateEmploymentReport(clientId: string, overrideMarkdown?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        throw new Error("Unauthorized");
    }

    const recent = await prisma.reportVersion.findFirst({
        where: {
            clientId,
            createdById: auth.userId,
            createdAt: {
                gt: new Date(Date.now() - 30 * 1000)
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (recent) {
        throw new Error("Please wait 30 seconds before regenerating.");
    }

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
            intakes: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    employment: true
                }
            },
            documents: true,
            followUps: {
                orderBy: { contactDate: 'desc' },
                take: 1
            },
            employmentHistory: true,
            ispGoals: true,
            supportiveServices: true
        }
    });

    if (!client) {
        throw new Error("Client not found");
    }

    // Fix: Ensure the bundle matches the IntakeBundle type expectations
    const bundle: any = {
        client,
        intake: client.intakes[0] || null,
        employment: client.intakes[0]?.employment || null,
        documents: client.documents,
        follow_up: client.followUps[0] || null,
        employment_history: client.employmentHistory || [],
        isp_goals: client.ispGoals || [],
        supportive_services: client.supportiveServices || []
    };

    const compliance = validateIntakeBundle(bundle);

    if (!compliance.valid) {
        return {
            status: "blocked",
            issues: compliance.missing
        };
    }

    let markdown = overrideMarkdown;
    if (!markdown) {
        markdown = await runDorAgent(bundle);
    }

    let pdfUrl = '';
    try {
        const { markdownToPdf } = await import('@/lib/pdf/markdownToPdf');
        await markdownToPdf(markdown); // Validating PDF can be generated

        const fileName = `client-${clientId}/${uuidv4()}.pdf`;
        console.log(`[STORAGE] Would upload ${fileName} to local report storage`);
        pdfUrl = `/api/reports/download?path=${fileName}`; 
    } catch (pdfErr) {
        console.error('PDF Generation Error:', pdfErr);
    }

    const reportId = uuidv4();

    await prisma.reportVersion.create({
        data: {
            id: reportId,
            clientId,
            contentMarkdown: markdown,
            createdById: auth.userId
        }
    });

    await logReportGenerated(clientId, reportId);

    return {
        status: "generated",
        reportVersionId: reportId,
        markdown,
        pdfUrl
    };
}
