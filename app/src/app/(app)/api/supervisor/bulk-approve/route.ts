import { NextRequest, NextResponse } from 'next/server';
import { bulkApproveReports } from '@/lib/supervisor/supervisorReports';
import {
    verifyAuthentication,
    verifyAuthorization,
    prisma,
    validateUUIDs
} from '@/lib/auth/authHelpersServer';

/**
 * POST /api/supervisor/bulk-approve
 * 
 * Approve multiple intake reports at once
 * 
 * Security:
 * - Requires authentication
 * - Requires supervisor or admin role
 * - CSRF protection via origin verification
 * - Input validation (array format, UUID validation, size limits)
 * 
 * Body:
 * {
 *   intakeIds: string[];
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Authentication & Authorization
        const auth = await verifyAuthentication();
        if (!auth.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authz = await verifyAuthorization(['supervisor', 'admin']);
        if (!authz.authorized) {
            return NextResponse.json(
                { error: authz.error || 'Forbidden' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { intakeIds } = body;

        // Validate required fields
        if (!intakeIds || !Array.isArray(intakeIds) || intakeIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid intakeIds array' },
                { status: 400 }
            );
        }

        // SECURITY: Limit bulk operations to reasonable size
        if (intakeIds.length > 50) {
            return NextResponse.json(
                { error: 'Cannot approve more than 50 reports at once' },
                { status: 400 }
            );
        }

        // SECURITY: Validate all IDs are valid UUIDs
        const validation = validateUUIDs(intakeIds);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Invalid UUID format in intakeIds',
                    invalidIds: validation.invalidIds
                },
                { status: 400 }
            );
        }

        // SECURITY: Check for Conflict of Interest (Cannot approve own work)
        // Fetch the creator (preparedById) for all requested intakes
        const reports = await prisma.intake.findMany({
            where: { id: { in: intakeIds } },
            select: { preparedById: true }
        });

        const hasConflict = reports?.some((r: any) => r.preparedById === auth.userId);
        if (hasConflict) {
            return NextResponse.json(
                { error: 'Conflict of Interest: You cannot approve reports you prepared herself' },
                { status: 403 }
            );
        }

        // Bulk approve reports
        const result = await bulkApproveReports(intakeIds);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to bulk approve reports' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully approved ${result.count} reports`
        });

    } catch (error) {
        console.error('Error in bulk-approve API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
