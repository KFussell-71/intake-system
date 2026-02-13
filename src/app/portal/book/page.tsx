import { BookingWizard } from '@/features/portal/components/BookingWizard';
import { getPortalClientData } from '@/app/actions/portal/getPortalClientData';
import { redirect } from 'next/navigation';

export default async function BookPage() {
    const { success, data } = await getPortalClientData();

    if (!success || !data) {
        redirect('/portal/login');
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Book an Appointment</h1>
                <p className="text-slate-500 mt-2">Schedule a time to meet with your caseworker.</p>
            </div>

            <BookingWizard clientId={data.client.id} />
        </div>
    );
}
