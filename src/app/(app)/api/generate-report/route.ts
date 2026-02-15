import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runDorAgent, IntakeBundle } from '@/lib/agents/dorAgent';
import { validateIntakeBundle } from '@/lib/validations/generationValidator';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import {
    verifyAuthorization,
    verifyOrigin,
    isValidUUID
} from '@/lib/auth/authHelpersServer';

export const runtime = 'edge';

/**
 * POST /api/generate-report
 * 
 * Generate AI-powered employment services intake report
 * 
 * SECURITY CONTROLS (BLUE TEAM REMEDIATION):
 * - Authentication: Requires valid session
 * - Authorization: Requires staff, supervisor, or admin role
 * - CSRF Protection: Verifies request origin
 * - Access Control: Verifies user can access the client
 * - Audit Logging: Logs all report generation attempts
 * - Rate Limiting: Prevents abuse (10 requests per hour per user)
 * - Input Validation: Validates UUID format
 * 
 * RED TEAM FINDING: CRITICAL-1 - Missing authentication
 * REMEDIATION: Added full auth/authz/audit stack
 */

// Simple in-memory rate limiter (production should use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 requests per hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (userLimit.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    userLimit.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

export async function POST(req: NextRequest) {
    try {
        // SECURITY: CSRF Protection
        if (!verifyOrigin(req)) {
            return NextResponse.json(
                { error: 'Invalid request origin' },
                { status: 403 }
            );
        }

        // SECURITY: Authentication & Authorization
        const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
        if (!authz.authorized) {
            return NextResponse.json(
                { error: authz.error || 'Unauthorized' },
                { status: authz.error?.includes('authenticated') ? 401 : 403 }
            );
        }

        const { clientId, previewData } = await req.json();

        // SECURITY: Input Validation
        if (!clientId && !previewData) {
            return NextResponse.json({ error: 'Missing clientId or previewData' }, { status: 400 });
        }

        if (clientId && !isValidUUID(clientId)) {
            return NextResponse.json(
                { error: 'Invalid clientId format - must be a valid UUID' },
                { status: 400 }
            );
        }

        // SECURITY: Rate Limiting
        const rateLimit = checkRateLimit(authz.userId!);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Maximum 10 report generations per hour.',
                    retryAfter: 3600
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '3600'
                    }
                }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        let bundle: IntakeBundle | null = null;

        if (previewData) {
            // PREVIEW MODE: Construct pseudo-bundle from draft data
            // We map the form state to the bundle structure expected by the Agent
            bundle = {
                client: {
                    id: 'preview-id',
                    name: previewData.clientName || 'DRAFT CLIENT',
                    first_name: previewData.clientName?.split(' ')[0] || 'DRAFT',
                    last_name: previewData.clientName?.split(' ').slice(1).join(' ') || 'CLIENT',
                    phone: previewData.phone,
                    email: previewData.email,
                    address: previewData.address,
                    ssn_last_four: previewData.ssnLastFour || 'XXXX'
                },
                intake: {
                    id: 'preview-intake-id',
                    intake_date: new Date().toISOString(),
                    report_date: previewData.reportDate || new Date().toISOString(),
                    status: 'DRAFT_PREVIEW',
                    details: previewData,
                    employment_specialist: 'Preview User' // Placeholder, will be overwritten by preparerName
                },
                employment_history: [], // Todo: If form has this, map it
                isp_goals: (previewData.ispGoals || []).map((g: any) => ({
                    id: 'preview-goal-' + Math.random(),
                    goal_type: g.goal,
                    status: 'proposed',
                    // Note: counselor_rationale is in details, or we can map it here if the agent expects it on the goal
                    counselor_rationale: g.counselorRationale
                })),
                supportive_services: [
                    previewData.resumeComplete && { id: 's1', service_type: 'Resume Development', description: 'Assistance with resume', status: 'requested' },
                    previewData.interviewSkills && { id: 's2', service_type: 'Interview Prep', description: 'Mock interviews', status: 'requested' },
                    previewData.transportationAssistance && { id: 's3', service_type: 'Transportation', description: 'Bus pass/gas card', status: 'requested' }
                ].filter(Boolean) as any[],
                documents: [],
                follow_up: { notes: 'Preview Mode' }
            } as any;

        } else {
            // STANDARD MODE: Fetch from DB

            // SECURITY: Access Control - Verify user can access this client
            const { data: accessCheck, error: accessError } = await supabase
                .from('client_assignments')
                .select('id')
                .eq('client_id', clientId)
                .eq('assigned_worker_id', authz.userId)
                .eq('active', true)
                .single();

            // If not assigned, check if user is supervisor/admin
            if (accessError || !accessCheck) {
                if (authz.role !== 'supervisor' && authz.role !== 'admin') {
                    // SECURITY: Audit failed access attempt
                    await supabase.from('audit_logs').insert({
                        user_id: authz.userId,
                        action: 'generate_report_denied',
                        resource_type: 'client',
                        resource_id: clientId,
                        metadata: { reason: 'not_assigned', role: authz.role },
                        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                        user_agent: req.headers.get('user-agent')
                    });

                    return NextResponse.json(
                        { error: 'Access denied. You are not assigned to this client.' },
                        { status: 403 }
                    );
                }
            }

            // SECURITY: Audit successful access
            await supabase.from('audit_logs').insert({
                user_id: authz.userId,
                action: 'generate_report_started',
                resource_type: 'client',
                resource_id: clientId,
                metadata: { role: authz.role },
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                user_agent: req.headers.get('user-agent')
            });

            // 1. Fetch Client Bundle via RPC (Authoritative Source)
            const { data: rpcData, error } = await supabase.rpc('get_client_intake_bundle', {
                p_client_id: clientId
            });

            if (error) {
                await supabase.from('audit_logs').insert({
                    user_id: authz.userId,
                    action: 'generate_report_failed',
                    resource_type: 'client',
                    resource_id: clientId,
                    metadata: { error: error.message },
                    ip_address: req.headers.get('x-forwarded-for'),
                    user_agent: req.headers.get('user-agent')
                });
                throw new Error(`RPC Error: ${error.message}`);
            }

            if (!rpcData) return NextResponse.json({ error: 'Client bundle not found' }, { status: 404 });

            bundle = rpcData as IntakeBundle;

            // 2. Compliance Gate (Validation) - Only for final reports
            const validation = validateIntakeBundle(bundle);
            if (!validation.valid) {
                return NextResponse.json({
                    error: 'Cannot generate report. Incomplete DOR record.',
                    missingFields: validation.missing
                }, { status: 422 });
            }
        }

        // 3. Fetch Preparer Identity (BLUE TEAM REMEDIATION: RT-AI-001)
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', authz.userId)
            .single();

        const preparerName = profile?.username || 'Employment Specialist';

        // 4. Run AI Agent (Locked Prompt)
        const markdown = await runDorAgent(bundle as IntakeBundle, preparerName);

        // If preview, prepend Warning
        const finalMarkdown = previewData
            ? `# ⚠️ DRAFT PREVIEW - NOT FILED ⚠️\n\n${markdown}`
            : markdown;

        // SECURITY: Audit successful generation
        await supabase.from('audit_logs').insert({
            user_id: authz.userId,
            action: previewData ? 'generate_preview_completed' : 'generate_report_completed',
            resource_type: 'client',
            resource_id: clientId || 'preview',
            metadata: {
                role: authz.role,
                report_length: markdown.length,
                rate_limit_remaining: rateLimit.remaining,
                is_preview: !!previewData
            },
            ip_address: req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent')
        });

        return NextResponse.json({
            success: true,
            markdown: finalMarkdown,
            bundle,
            rateLimit: {
                remaining: rateLimit.remaining,
                limit: RATE_LIMIT_MAX
            }
        }, {
            headers: {
                'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString()
            }
        });

    } catch (error) {
        hipaaLogger.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
