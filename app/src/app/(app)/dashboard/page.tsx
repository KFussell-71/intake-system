import { redirect } from 'next/navigation';
import { getDashboardStatsAction } from '../actions/getDashboardStatsAction';
import { DashboardClient } from './DashboardClient';

/**
 * Staff Dashboard (Server Component Refactor)
 * 
 * Migrated from 'use client' and Supabase browser client to secure 
 * Server Action data fetching and NextAuth session management.
 */
export default async function DashboardPage() {
    const result = await getDashboardStatsAction();

    if (!result.success) {
        redirect('/login');
    }

    return (
        <DashboardClient 
            stats={result.data!} 
            user={{ 
                id: result.userId, 
                email: 'staff@agency.com' // Placeholder as we don't have full profile yet
            }} 
            role={result.role || 'staff'}
        />
    );
}
