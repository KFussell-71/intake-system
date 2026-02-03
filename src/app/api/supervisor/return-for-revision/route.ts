import { NextRequest, NextResponse } from 'next/server';
import { returnForRevision } from '@/lib/supervisor/supervisorActions';
import {
    verifyAuthorization,
    verifyOrigin,
    isValidUUID,
    sanitizeText
} from '@/lib/auth/authHelpersServer';

/**
 * POST /api/supervisor/return-for-revision
 * 
 * Return an intake report to the specialist for revision
 * 
 * Security:
 * - Requires authentication
 * - Requires supervisor or admin role
 * - CSRF protection via origin verification
 * - Input validation (UUID format, text length)
 * 
 * Body:
 * {
 *   intakeId: string;
 *   reason: string;
 *   notes: string;
 *   urgent?: boolean;
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: CSRF Protection
        if (!verifyOrigin(request)) {
            return NextResponse.json(
                { error: 'Invalid request origin' },
                { status: 403 }
            );
        }

        // SECURITY: Authentication & Authorization
        const authz = await verifyAuthorization(['supervisor', 'admin']);
        if (!authz.authorized) {
            return NextResponse.json(
                { error: authz.error || 'Unauthorized' },
                { status: authz.error?.includes('authenticated') ? 401 : 403 }
            );
        }

        const body = await request.json();
        const { intakeId, reason, notes, urgent = false } = body;

        // Validate required fields
        if (!intakeId || !reason || !notes) {
            return NextResponse.json(
                { error: 'Missing required fields: intakeId, reason, notes' },
                { status: 400 }
            );
        }

        // SECURITY: Validate UUID format
        if (!isValidUUID(intakeId)) {
            return NextResponse.json(
                { error: 'Invalid intakeId format - must be a valid UUID' },
                { status: 400 }
            );
        }

        // SECURITY: Sanitize and validate reason
        const sanitizedReason = sanitizeText(reason, 200);
        if (!sanitizedReason.valid) {
            return NextResponse.json(
                { error: 'Reason: ' + sanitizedReason.error },
                { status: 400 }
            );
        }

        // SECURITY: Sanitize and validate notes (detailed feedback)
        const sanitizedNotes = sanitizeText(notes, 5000); // Allow longer feedback
        if (!sanitizedNotes.valid) {
            return NextResponse.json(
                { error: 'Notes: ' + sanitizedNotes.error },
                { status: 400 }
            );
        }

        // Minimum feedback length for quality
        if (sanitizedNotes.sanitized.length < 20) {
            return NextResponse.json(
                { error: 'Detailed feedback must be at least 20 characters for quality assurance' },
                { status: 400 }
            );
        }

        // Return report for revision
        const result = await returnForRevision(
            intakeId,
            sanitizedReason.sanitized,
            sanitizedNotes.sanitized,
            Boolean(urgent)
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to return report for revision' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Report returned for revision',
            urgent: Boolean(urgent)
        });

    } catch (error) {
        console.error('Error in return-for-revision API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
