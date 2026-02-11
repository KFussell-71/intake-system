import { NextRequest, NextResponse } from 'next/server';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import { auditService } from '@/services/auditService';
import { aiService } from '@/lib/ai/UnifiedAIService';
import { obs } from '@/services/observabilityService';
import {
    verifyAuthorization,
    verifyOrigin
} from '@/lib/auth/authHelpersServer';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'edge';

/**
 * POST /api/ai/gemini
 * 
 * Secure proxy for client-side AI features (compliance validation, logic checks)
 * 
 * SECURITY CONTROLS (BLUE TEAM - CLIENT-SIDE AI PROXY):
 * - Authentication: Requires valid session
 * - Authorization: Requires staff, supervisor, or admin role
 * - CSRF Protection: Verifies request origin
 * - Input Sanitization: Sanitizes prompts to prevent injection
 * - Rate Limiting: Prevents abuse (20 requests per hour per user)
 * - Audit Logging: Logs all AI requests
 * 
 * This route eliminates the need for NEXT_PUBLIC_GEMINI_API_KEY
 */

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // 20 requests per hour

/**
 * SECURITY: Sanitize AI prompt to prevent injection
 */
function sanitizePrompt(prompt: string): string {
    if (!prompt) return '';

    return prompt
        .replace(/[^\w\s@.,;:?!()\-\[\]{}"'<>/|\\]/g, '') // Remove dangerous chars but allow XML tags
        .substring(0, 5000) // Limit length
        .trim();
}

export async function POST(req: NextRequest) {
    const span = obs.startSpan('ai_proxy_post');
    try {
        // SECURITY: CSRF Protection
        if (!verifyOrigin(req)) {
            span.recordError(new Error('Invalid origin'));
            return NextResponse.json(
                { error: 'Invalid request origin' },
                { status: 403 }
            );
        }

        // SECURITY: Authentication & Authorization
        const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
        if (!authz.authorized) {
            span.recordError(new Error('Unauthorized'));
            return NextResponse.json(
                { error: authz.error || 'Unauthorized' },
                { status: authz.error?.includes('authenticated') ? 401 : 403 }
            );
        }

        const { prompt, temperature = 0.3 } = await req.json();

        // SECURITY: Input Validation
        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        // SECURITY: Rate Limiting
        const rateLimit = await checkRateLimit(authz.userId!, 'gemini_ai', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);

        if (!rateLimit.allowed) {
            span.recordError(new Error('Rate limit exceeded'));
            const retryAfter = Math.ceil((new Date(rateLimit.resetAt).getTime() - Date.now()) / 1000);
            return NextResponse.json(
                { error: `Rate limit exceeded.`, retryAfter },
                { status: 429 }
            );
        }

        // SECURITY: Sanitize prompt
        const sanitizedPrompt = sanitizePrompt(prompt);

        // Call Unified AI Service
        const aiResponse = await aiService.generateText({
            prompt: sanitizedPrompt,
            temperature: Math.min(Math.max(temperature, 0), 1),
            userId: authz.userId!
        });

        // SECURITY: Audit log
        await auditService.log({
            userId: authz.userId,
            action: 'AI_QUERY',
            entityType: 'ai_service',
            entityId: aiResponse.model,
            details: {
                promptLength: sanitizedPrompt.length,
                responseLength: aiResponse.text.length,
                model: aiResponse.model
            }
        });

        span.end();
        return NextResponse.json({
            success: true,
            text: aiResponse.text,
            rateLimit: {
                remaining: rateLimit.remaining,
                limit: RATE_LIMIT_MAX
            }
        });

    } catch (error: any) {
        span.recordError(error);
        hipaaLogger.error('AI Proxy Error:', error);
        return NextResponse.json(
            { error: 'AI service error' },
            { status: 500 }
        );
    }
}
