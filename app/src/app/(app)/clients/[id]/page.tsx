import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { ClientProfileLayout } from '@/features/clients/components/ClientProfileLayout';
import { ClientTimeline } from '@/features/clients/components/ClientTimeline';
import { CaseNotesFeed } from '@/features/clients/components/CaseNotesFeed';
import { DocumentManager } from '@/features/documents/DocumentManager';
import { AppointmentCalendar } from '@/features/scheduling/components/AppointmentCalendar';
import { AssessmentManager } from '@/features/forms/components/AssessmentManager';
import { notFound, redirect } from 'next/navigation';

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAuthentication();

    if (!auth.authenticated || !auth.userId) redirect('/login');

    // 1. Fetch Client Profile & Intakes
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            intakes: {
                select: {
                    id: true,
                    status: true,
                    reportDate: true,
                    createdAt: true,
                    data: true
                }
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!client) {
        console.error('Client not found');
        notFound();
    }

    // 2. Fetch Case Notes
    const notes = await prisma.caseNote.findMany({
        where: { clientId: id },
        include: {
            author: {
                select: {
                    name: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch Appointments
    const appointments = await prisma.appointment.findMany({
        where: { clientId: id }
    });

    // 3. Build Timeline Events
    // Combine Intakes, Notes, and Creation Date
    const events = [
        ...(client.intakes?.map((i: any) => ({
            id: i.id,
            date: i.reportDate || i.createdAt, // Prefer report date logic
            type: 'intake',
            title: 'Intake Assessment',
            status: i.status,
            description: `Assessment Date: ${i.reportDate}`
        })) || []),
        ...(notes?.filter((n: any) => ['clinical', 'incident'].includes(n.type)).map((n: any) => ({
            id: n.id,
            date: n.createdAt,
            type: 'note',
            title: n.type === 'incident' ? 'Incident Report' : 'Clinical Note',
            description: n.content.substring(0, 60) + (n.content.length > 60 ? '...' : '')
        })) || []),
        {
            id: 'creation',
            date: client.createdAt,
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
                notesSlot={<CaseNotesFeed notes={notes as any || []} clientId={client.id} currentUserId={auth.userId!} />}
                documentsSlot={<DocumentManager clientId={client.id} />}
                appointmentsSlot={<AppointmentCalendar appointments={appointments as any || []} clientId={client.id} />}
                assessmentsSlot={<AssessmentManager clientId={client.id} />}
            />
        </div>
    );
}
