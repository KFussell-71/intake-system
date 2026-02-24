import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = '/app/data/fleet/fleet_state.json';

export async function GET() {
    try {
        // Check if file exists
        try {
            await fs.access(STATE_FILE);
        } catch {
            // If it doesn't exist, discovery hasn't started or no peers found
            return NextResponse.json({
                success: true,
                fleet: [],
                timestamp: new Date().toISOString()
            });
        }

        const data = await fs.readFile(STATE_FILE, 'utf-8');
        const fleet = JSON.parse(data);

        return NextResponse.json({
            success: true,
            fleet,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[FleetAPI] Error reading fleet state:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to read fleet state',
            details: error.message
        }, { status: 500 });
    }
}
