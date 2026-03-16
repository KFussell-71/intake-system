import { redirect } from 'next/navigation';
import { getPortalClientData } from '@/actions/portal/getPortalClientData';
import { PortalDashboardClient } from './PortalDashboardClient';

/**
 * Portal Dashboard (Server Component Refactor)
 * 
 * Migrated from 'use client', sessionStorage, and Supabase browser client 
 * to secure Server Action data fetching and NextAuth session management.
 */
export default async function PortalDashboard() {
    const result = await getPortalClientData();

    if (!result.success || !result.data) {
        redirect('/portal/login');
    }

    return <PortalDashboardClient data={result.data} />;
}
