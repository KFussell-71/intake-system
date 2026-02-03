import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import {
    verifyAuthorization,
    verifyOrigin,
    sanitizeText
} from '@/lib/auth/authHelpersServer';

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

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // 20 requests per hour

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
 * SECURITY: Sanitize AI prompt to prevent injection
 */
function sanitizePrompt(prompt: string): string {
    if (!prompt) return '';

    return prompt
        .replace(/[^\w\s@.,;:?!()\-\[\]{}"']/g, '') // Remove dangerous chars
        .substring(0, 5000) // Limit length
        .trim();
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

        const { prompt, model = 'gemini-1.5-pro', temperature = 0.3 } = await req.json();

        // SECURITY: Input Validation
        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        if (typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt must be a string' }, { status: 400 });
        }

        // SECURITY: Rate Limiting
        const rateLimit = checkRateLimit(authz.userId!);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Maximum 20 AI requests per hour.',
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

        // SECURITY: Sanitize prompt
        const sanitizedPrompt = sanitizePrompt(prompt);

        // SECURITY: Require API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            hipaaLogger.error('GEMINI_API_KEY environment variable is not set');
            return NextResponse.json(
                { error: 'AI service unavailable' },
                { status: 503 }
            );
        }

        // Call Google AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const aiModel = genAI.getGenerativeModel({
            model,
            generationConfig: {
                temperature: Math.min(Math.max(temperature, 0), 1) // Clamp 0-1
            }
        });

        const result = await aiModel.generateContent(sanitizedPrompt);
        const response = await result.response;
        const text = response.text();

        // SECURITY: Audit log
        // Note: Using hipaaLogger for now, should integrate with audit_logs table
        hipaaLogger.info('AI Request:', {
            userId: authz.userId,
            role: authz.role,
            promptLength: sanitizedPrompt.length,
            responseLength: text.length,
            model,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            text,
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
        hipaaLogger.error('AI Proxy Error:', error);
        return NextResponse.json(
            { error: 'AI service error' },
            { status: 500 }
        );
    }
}
