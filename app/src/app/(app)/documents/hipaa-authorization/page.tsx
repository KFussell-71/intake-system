import { HIPAAFormPage } from '@/features/documents/HIPAAFormPage';

export default async function HIPAAAuthorizationPage({ searchParams }: any) {
    const params = await searchParams;
    const intakeId = params.intakeId;

    if (!intakeId) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-600">Error: Missing Intake ID</h1>
                <p className="text-slate-500 mt-2">Please access this form through the clinical portal.</p>
            </div>
        );
    }

    return <HIPAAFormPage intakeId={intakeId} />;
}
