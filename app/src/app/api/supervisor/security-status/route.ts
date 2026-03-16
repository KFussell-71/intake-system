import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // Reports are stored in the fleet_data volume, mapped to /app/data/fleet
        const reportPath = '/app/data/fleet/vulnerability_report.json';

        if (!fs.existsSync(reportPath)) {
            return NextResponse.json({
                status: 'PENDING',
                message: 'Initial security scan in progress...'
            }, { status: 200 });
        }

        const rawData = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(rawData);

        // Filter for HIGH and CRITICAL vulnerabilities
        let highCount = 0;
        let criticalCount = 0;

        report.Results?.forEach((res: any) => {
            res.Vulnerabilities?.forEach((v: any) => {
                if (v.Severity === 'HIGH') highCount++;
                if (v.Severity === 'CRITICAL') criticalCount++;
            });
        });

        const isSecure = (highCount + criticalCount) === 0;

        return NextResponse.json({
            status: isSecure ? 'PASS' : 'WARNING',
            lastScan: fs.statSync(reportPath).mtime,
            summary: {
                high: highCount,
                critical: criticalCount,
                total: highCount + criticalCount
            }
        });

    } catch (err) {
        console.error('[SECURITY_STATUS_ERROR]', err);
        return NextResponse.json({
            status: 'ERROR',
            message: 'Secure link to sentinel lost.'
        }, { status: 500 });
    }
}

// Required for dynamic filesystem access
export const dynamic = 'force-dynamic';
