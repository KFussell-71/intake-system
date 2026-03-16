import { NextRequest, NextResponse } from 'next/server';
import { runDorAgent, IntakeBundle } from '@/lib/agents/dorAgent';
import { validateIntakeBundle } from '@/lib/validations/generationValidator';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import {
    verifyAuthorization,
    verifyOrigin,
    isValidUUID,
    prisma
} from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

export const runtime = 'nodejs';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

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

/**
 * POST /api/generate-report
 * MIGRATED WITH UNIFIED AUDITING
 */
export async function POST(req: NextRequest) {
    try {
        // SECURITY: CSRF Protection
        if (!verifyOrigin(req)) {
            return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
        }

        // SECURITY: Authentication & Authorization
        const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
        if (!authz.authorized || !authz.userId) {
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
            return NextResponse.json({ error: 'Invalid clientId format' }, { status: 400 });
        }

        // SECURITY: Rate Limiting
        const rateLimit = checkRateLimit(authz.userId!);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded.', retryAfter: 3600 },
                { 
                    status: 429,
                    headers: { 'Retry-After': '3600' }
                }
            );
        }

        let bundle: IntakeBundle | null = null;

        if (previewData) {
            // PREVIEW MODE
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
                    employment_specialist: 'Preview User'
                },
                employment_history: previewData.workExperienceSummary ? [{
                    id: 'preview-work-1',
                    job_title: 'Previous Role',
                    employer: 'Previous Employer',
                    notes: previewData.workExperienceSummary
                }] : [],
                isp_goals: (previewData.ispGoals || []).map((g: any) => ({
                    id: 'preview-goal-' + Math.random(),
                    goal_type: g.goal,
                    status: 'proposed',
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
            // STANDARD MODE: Fetch from DB via Prisma
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { assignedToId: true }
            });

            // Access Control
            if (!client || (client.assignedToId !== authz.userId && authz.role !== 'supervisor' && authz.role !== 'admin')) {
                // Unified Audit Denied Access
                await auditService.log({
                    userId: authz.userId,
                    action: 'ACCESS_DENIED',
                    entityType: 'report_generation',
                    entityId: clientId,
                    details: { reason: 'insufficient_permissions', role: authz.role }
                });

                return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
            }

            // Audit Start via Unified Service
            await auditService.log({
                userId: authz.userId,
                action: 'READ',
                entityType: 'report_generation',
                entityId: clientId,
                details: { stage: 'started', role: authz.role }
            });

            // Fetch Client Bundle via RPC (using Prisma raw query as bridge)
            try {
                const rpcResult: any[] = await prisma.$queryRawUnsafe(`SELECT get_client_intake_bundle($1::uuid) as bundle`, clientId);
                bundle = rpcResult[0]?.bundle as IntakeBundle;

                if (!bundle) return NextResponse.json({ error: 'Client bundle not found' }, { status: 404 });
                
            } catch (error: any) {
                console.error('RPC Error:', error);
                throw new Error(`Failed to fetch client bundle`);
            }

            // Compliance Gate
            const validation = validateIntakeBundle(bundle!);
            if (!validation.valid) {
                return NextResponse.json({
                    error: 'Cannot generate report. Incomplete DOR record.',
                    missingFields: validation.missing
                }, { status: 422 });
            }
        }

        // Fetch Preparer Identity
        const profile = await prisma.profile.findUnique({
            where: { id: authz.userId },
            select: { fullName: true }
        });

        const preparerName = profile?.fullName || 'Employment Specialist';

        // Run AI Agent
        const markdown = await runDorAgent(bundle as IntakeBundle, preparerName);

        const finalMarkdown = previewData
            ? `# ⚠️ DRAFT PREVIEW - NOT FILED ⚠️\n\n${markdown}`
            : markdown;

        // Audit Completion via Unified Service
        await auditService.log({
            userId: authz.userId,
            action: previewData ? 'READ' : 'CREATE',
            entityType: 'report_generation',
            entityId: clientId || 'preview',
            details: { 
                stage: 'completed', 
                preview: !!previewData, 
                report_length: markdown.length 
            }
        });

        return NextResponse.json({
            success: true,
            markdown: finalMarkdown,
            bundle,
            rateLimit: {
                remaining: rateLimit.remaining,
                limit: RATE_LIMIT_MAX
            }
        });

    } catch (error) {
        hipaaLogger.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
