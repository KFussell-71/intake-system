import { NextRequest, NextResponse } from 'next/server';
import { assignClientToWorker } from '@/lib/supervisor/supervisorActions';
import {
    verifyAuthorization,
    verifyOrigin,
    isValidUUID,
    sanitizeText,
    isValidAssignmentType
} from '@/lib/auth/authHelpersServer';

/**
 * POST /api/supervisor/assign-worker
 * 
 * Assign a client to an employment specialist
 * 
 * Security:
 * - Requires authentication
 * - Requires supervisor or admin role
 * - CSRF protection via origin verification
 * - Input validation (UUID format, text length, enum values)
 * 
 * Body:
 * {
 *   clientId: string;
 *   workerId: string;
 *   assignmentType: 'primary' | 'secondary';
 *   notes?: string;
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
        const { clientId, workerId, assignmentType, notes } = body;

        // Validate required fields
        if (!clientId || !workerId || !assignmentType) {
            return NextResponse.json(
                { error: 'Missing required fields: clientId, workerId, assignmentType' },
                { status: 400 }
            );
        }

        // SECURITY: Validate UUID format
        if (!isValidUUID(clientId)) {
            return NextResponse.json(
                { error: 'Invalid clientId format - must be a valid UUID' },
                { status: 400 }
            );
        }

        if (!isValidUUID(workerId)) {
            return NextResponse.json(
                { error: 'Invalid workerId format - must be a valid UUID' },
                { status: 400 }
            );
        }

        // SECURITY: Validate assignment type enum
        if (!isValidAssignmentType(assignmentType)) {
            return NextResponse.json(
                { error: 'Invalid assignment type. Must be "primary" or "secondary"' },
                { status: 400 }
            );
        }

        // SECURITY: Sanitize and validate notes
        const sanitizedNotes = sanitizeText(notes || '', 2000);
        if (!sanitizedNotes.valid) {
            return NextResponse.json(
                { error: sanitizedNotes.error },
                { status: 400 }
            );
        }

        // Assign client to worker
        const result = await assignClientToWorker({
            client_id: clientId,
            assigned_worker_id: workerId,
            assignment_type: assignmentType,
            notes: sanitizedNotes.sanitized
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to assign worker' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: 'Client successfully assigned to worker'
        });

    } catch (error) {
        console.error('Error in assign-worker API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
