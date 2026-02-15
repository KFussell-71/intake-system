'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { intakeController } from '@/controllers/IntakeController';

export default function PrintableCaseFile() {
    const params = useParams();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<any>(null);
    const [intake, setIntake] = useState<any>(null);
    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // 1. Fetch Client & Intake
            const { data: clientData, error } = await supabase
                .from('clients')
                .select('*, intakes(*)')
                .eq('id', clientId)
                .single();

            if (clientData) {
                setClient(clientData);
                const latestIntake = clientData.intakes?.[0]; // Assuming most recent for now
                if (latestIntake) {
                    setIntake(latestIntake);
                    // 2. Fetch Clinical Assessment
                    const assessmentData = await intakeController.getAssessment(latestIntake.id);
                    setAssessment(assessmentData);
                }
            }
            setLoading(false);
        };
        load();
    }, [clientId]);

    if (loading) return <div className="p-12 text-center font-serif">Generating Case File...</div>;
    if (!client) return <div className="p-12 text-center font-serif">Case Not Found</div>;

    const data = intake?.data || {};

    return (
        <div className="min-h-screen bg-white text-black font-serif p-8 max-w-[210mm] mx-auto print:max-w-none print:p-0">
            {/* Print-Only Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none; }
                }
            `}</style>

            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest">Confidential Case Record</h1>
                    <p className="text-sm mt-1">Vocational Rehabilitation Services</p>
                </div>
                <div className="text-right text-sm">
                    <p><strong>Case ID:</strong> {client.case_id || client.id.slice(0, 8)}</p>
                    <p><strong>Date Printed:</strong> {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Section 1: Identity */}
            <section className="mb-8">
                <h2 className="text-lg font-bold border-b border-black mb-4 uppercase">I. Participant Identity</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><span className="font-bold">Full Name:</span> {client.first_name} {client.last_name}</p>
                        <p><span className="font-bold">Phone:</span> {client.phone}</p>
                        <p><span className="font-bold">Email:</span> {client.email}</p>
                    </div>
                    <div>
                        <p><span className="font-bold">SSN (Last 4):</span> {data.ssnLastFour}</p>
                        <p><span className="font-bold">Address:</span> {data.address}</p>
                        <p><span className="font-bold">Intake Date:</span> {data.reportDate}</p>
                    </div>
                </div>
            </section>

            {/* Section 2: Clinical Assessment (The "Professional" View) */}
            <section className="mb-8 bg-gray-50 p-4 border border-gray-200 print:border-black print:bg-transparent">
                <h2 className="text-lg font-bold border-b border-black mb-4 uppercase">II. Clinical Assessment & Eligibility</h2>

                {assessment ? (
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-bold block mb-1">Eligibility Status:</span>
                                <span className="uppercase font-bold border border-black px-2 py-1 inline-block">
                                    {assessment.eligibility_status || 'PENDING'}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold block mb-1">Priority Group:</span>
                                <span className="uppercase font-bold border border-black px-2 py-1 inline-block">
                                    Category {assessment.recommended_priority_level || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="font-bold block mb-1">Clinical Rationale:</span>
                            <p className="leading-relaxed text-justify whitespace-pre-wrap">
                                {assessment.eligibility_rationale || 'Rationale not documented.'}
                            </p>
                        </div>

                        <div>
                            <span className="font-bold block mb-1">Verified Barriers (Documented):</span>
                            {assessment.verified_barriers?.length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {assessment.verified_barriers.map((b: string) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="italic">No barriers verified at this time.</p>
                            )}
                        </div>
                        <div>
                            <span className="font-bold block mb-1">Clinical Narrative:</span>
                            <p className="leading-relaxed text-justify whitespace-pre-wrap">
                                {assessment.clinical_narrative || 'No narrative on file.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="italic text-sm">No clinical assessment on file.</p>
                )}
            </section>

            {/* Section 3: Client Self-Report */}
            <section className="mb-8">
                <h2 className="text-lg font-bold border-b border-black mb-4 uppercase">III. Self-Reported Data</h2>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <h3 className="font-bold underline mb-2">Barriers to Employment</h3>
                        <ul className="list-disc pl-5">
                            {data.barriers?.map((b: string) => <li key={b}>{b}</li>) || <li>None reported</li>}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold underline mb-2">Support Services Requested</h3>
                        <ul className="list-disc pl-5">
                            {data.supportServices?.map((s: string) => <li key={s}>{s}</li>) || <li>None reported</li>}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 4: Employment Plan */}
            <section className="mb-8">
                <h2 className="text-lg font-bold border-b border-black mb-4 uppercase">IV. Initial Employment Goals</h2>
                <div className="text-sm space-y-2">
                    <p><span className="font-bold">Goal 1:</span> {data.employmentGoals || 'Not set'}</p>
                    <p><span className="font-bold">Education Goal:</span> {data.educationGoals || 'Not set'}</p>
                    <h3 className="font-bold mt-4 underline">Target Industries</h3>
                    <p>{data.industryPreferences?.join(', ') || 'None selected'}</p>
                </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-black text-xs flex justify-between">
                <div>
                    <p>Generated by Intake System v2.0</p>
                    <p>Confidential - For Professional Use Only</p>
                </div>
                <div className="text-right">
                    <p>Client Signature: __________________________________ Date: _________</p>
                    <br />
                    <p>Counselor Signature: __________________________________ Date: _________</p>
                </div>
            </div>

            {/* Print Button (Screen Only) */}
            <button
                onClick={() => window.print()}
                className="no-print fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl font-sans font-bold hover:bg-blue-700 transition-colors"
            >
                🖨️ Print Case File
            </button>
        </div>
    );
}
