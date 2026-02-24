"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from '@/lib/auth/guard';
import { validateIntakeBundle } from "@/lib/validations/generationValidator";
import { runDorAgent } from "@/lib/agents/dorAgent";
import { logReportGenerated } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export async function generateEmploymentReport(clientId: string, overrideMarkdown?: string) {
    // 1. Strict Auth Verification
    const { user, supabase } = await requireAuth();

    // 2. Idempotency Check (Prevent spamming generation)
    // Check for reports generated in last 30 seconds
    const { data: recent } = await supabase
        .from('report_versions')
        .select('created_at')
        .eq('client_id', clientId)
        .eq('created_by', user.id)
        .gt('created_at', new Date(Date.now() - 30 * 1000).toISOString())
        .limit(1)
        .single();

    if (recent) {
        throw new Error("Please wait 30 seconds before regenerating.");
    }

    // 2. Fetch frozen intake bundle
    const { data: bundle, error } = await supabase.rpc(
        "get_client_intake_bundle",
        { p_client_id: clientId }
    );

    if (error || !bundle) {
        console.error('Bundle fetch error:', error);
        throw new Error("Unable to retrieve intake bundle");
    }

    // 3. Compliance pre-flight validation
    const compliance = validateIntakeBundle(bundle);

    if (!compliance.valid) {
        return {
            status: "blocked",
            issues: compliance.missing
        };
    }

    // 4. AI generation (or use override)
    let markdown = overrideMarkdown;
    if (!markdown) {
        markdown = await runDorAgent(bundle);
    }

    // 5. Generate Official State PDF Artifact
    let pdfUrl = '';
    try {
        const { markdownToPdf } = await import('@/lib/pdf/markdownToPdf');
        const pdfBuffer = await markdownToPdf(markdown);

        const fileName = `client-${clientId}/${uuidv4()}.pdf`;

        const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (!uploadError) {
            // Secure PDF access via Signed URL (1 hour)
            const { data, error: urlError } = await supabase.storage
                .from('reports')
                .createSignedUrl(fileName, 3600);

            if (data) pdfUrl = data.signedUrl;
        }
    } catch (pdfErr) {
        console.error('PDF Generation/Upload Error:', pdfErr);
    }

    // 6. Persist immutable report version
    const reportId = uuidv4();

    const { error: insertError } = await supabase
        .from("report_versions")
        .insert({
            id: reportId,
            client_id: clientId,
            content_markdown: markdown,
            created_by: user.id
        });

    if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error("Failed to save report version");
    }

    // 7. SECURITY: Log report generation for audit trail
    await logReportGenerated(clientId, reportId);

    return {
        status: "generated",
        reportVersionId: reportId,
        markdown,
        pdfUrl
    };
}
