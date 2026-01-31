"use server";

import { createClient } from "@/lib/supabase/server";
import { validateIntakeBundle } from "@/lib/validations/generationValidator";
import { runDorAgent } from "@/lib/agents/dorAgent";
import { logReportGenerated } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export async function generateEmploymentReport(clientId: string) {
    const supabase = await createClient();

    // 1. Pre-capture auth context (prevent timeout loss during long generation)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized: Active session required");

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

    // 4. AI generation
    const markdown = await runDorAgent(bundle);

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
