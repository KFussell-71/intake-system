"use server";

import { createClient } from "@/lib/supabase/server";
import { validateIntakeBundle } from "@/lib/validations/generationValidator";
import { runDorAgent } from "@/lib/agents/dorAgent";
import { v4 as uuidv4 } from "uuid";

export async function generateEmploymentReport(clientId: string) {
    const supabase = createClient();

    // 1. Fetch frozen intake bundle (single source of truth)
    const { data: bundle, error } = await supabase.rpc(
        "get_client_intake_bundle",
        { p_client_id: clientId }
    );

    if (error || !bundle) {
        console.error('Bundle fetch error:', error);
        throw new Error("Unable to retrieve intake bundle");
    }

    // 2. Compliance pre-flight validation (blocking)
    const compliance = validateIntakeBundle(bundle);

    if (!compliance.valid) {
        return {
            status: "blocked",
            issues: compliance.missing
        };
    }

    // 3. AI generation (deterministic input)
    const markdown = await runDorAgent(bundle);

    // 4. Generate Official State PDF Artifact
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
            const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName);
            pdfUrl = publicUrl;
        }
    } catch (pdfErr) {
        console.error('PDF Generation/Upload Error:', pdfErr);
    }

    // 5. Persist immutable report version
    const reportId = uuidv4();

    const { error: insertError } = await supabase
        .from("report_versions")
        .insert({
            id: reportId,
            client_id: clientId,
            content_markdown: markdown,
            created_by: (await supabase.auth.getUser()).data.user?.id
        });

    if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error("Failed to save report version");
    }

    return {
        status: "generated",
        reportVersionId: reportId,
        markdown,
        pdfUrl
    };
}
