import { createClient } from '@/lib/supabase/server';
import { ClientProfileLayout } from '@/features/clients/components/ClientProfileLayout';
import { ClientTimeline } from '@/features/clients/components/ClientTimeline';
import { CaseNotesFeed } from '@/features/clients/components/CaseNotesFeed';
import { DocumentManager } from '@/features/documents/DocumentManager';
import { AppointmentCalendar } from '@/features/scheduling/components/AppointmentCalendar';
import { AssessmentManager } from '@/features/forms/components/AssessmentManager';
import { notFound, redirect } from 'next/navigation';

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // 1. Fetch Client Profile & Intakes
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
            *,
            intakes (
                id,
                status,
                report_date,
                created_at,
                data
            ),
            assigned_to (
                id,
                username,
                role
            )
        `)
        .eq('id', id)
        .single();

    if (clientError || !client) {
        console.error('Client not found:', clientError);
        notFound();
    }

    // 2. Fetch Case Notes
    const { data: notes } = await supabase
        .from('case_notes')
        .select(`
            *,
            author:author_id (
                username,
                role
            )
        `)
        .eq('client_id', id)
        .order('created_at', { ascending: false });

    // 3. Fetch Appointments (New Phase 10)
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', id);

    // 3. Build Timeline Events
    // Combine Intakes, Notes, and Creation Date
    const events = [
        ...(client.intakes?.map((i: any) => ({
            id: i.id,
            date: i.report_date || i.created_at, // Prefer report date logic
            type: 'intake',
            title: 'Intake Assessment',
            status: i.status,
            description: `Assessment Date: ${i.report_date}`
        })) || []),
        ...(notes?.filter((n: any) => ['clinical', 'incident'].includes(n.type)).map((n: any) => ({
            id: n.id,
            date: n.created_at,
            type: 'note',
            title: n.type === 'incident' ? 'Incident Report' : 'Clinical Note',
            description: n.content.substring(0, 60) + (n.content.length > 60 ? '...' : '')
        })) || []),
        {
            id: 'creation',
            date: client.created_at,
            type: 'system',
            title: 'Client Profile Created',
            description: 'Initial registration in system'
        }
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="container mx-auto p-4 md:py-8 max-w-7xl">
            <ClientProfileLayout
                client={client}
                timelineSlot={<ClientTimeline events={events as any} />}
                notesSlot={<CaseNotesFeed notes={notes as any || []} clientId={client.id} currentUserId={user.id} />}
                documentsSlot={<DocumentManager clientId={client.id} />}
                appointmentsSlot={<AppointmentCalendar appointments={appointments as any || []} clientId={client.id} />}
                assessmentsSlot={<AssessmentManager clientId={client.id} />}
            />
        </div>
    );
}
