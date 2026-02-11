import { NextRequest, NextResponse } from 'next/server';
import { bulkApproveReports } from '@/lib/supervisor/supervisorReports';
import {
    verifyAuthorization,
    verifyOrigin,
    validateUUIDs,
    createSupabaseServerClient
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
        // Fetch the creator (prepared_by) for all requested intakes
        const { data: reports, error: checkError } = await (await createSupabaseServerClient())
            .from('intakes')
            .select('prepared_by')
            .in('id', intakeIds);

        if (checkError) {
            console.error('Conflict check failed:', checkError);
            return NextResponse.json({ error: 'Integrity check failed' }, { status: 500 });
        }

        const hasConflict = reports?.some((r: { prepared_by: string }) => r.prepared_by === authz.userId);
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
