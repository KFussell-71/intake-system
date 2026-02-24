"use client";

import React from 'react';
import { SchemaForm } from '@/features/forms/components/SchemaForm';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NewIntakePage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        console.log("New Intake Data:", data);
        // Here you would call ClientRepository.create(data)
        // For now, simulate success
        alert("Client Created Successfully!");
        router.push('/dashboard');
    };

    return (
        <div className="container mx-auto max-w-3xl py-8 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">New Client Intake</h1>
                <p className="text-slate-500">Enter demographic and contact information to create a new client record.</p>
            </div>

            <Card className="p-6">
                <SchemaForm
                    schema={{
                        id: "new-client-intake",
                        title: "Client Demographics",
                        description: "Please enter the client's core information. Fields marked with * are required.",
                        fields: [
                            { name: "firstName", label: "First Name", type: "text", required: true },
                            { name: "lastName", label: "Last Name", type: "text", required: true },
                            { name: "email", label: "Email Address", type: "email", required: true },
                            { name: "phone", label: "Phone Number", type: "tel", placeholder: "(555) 555-5555" },
                            { name: "dob", label: "Date of Birth", type: "date", required: true },
                            {
                                name: "insuranceProvider",
                                label: "Insurance Provider",
                                type: "select",
                                options: [
                                    { label: "Medicaid", value: "medicaid" },
                                    { label: "Medicare", value: "medicare" },
                                    { label: "Private Insurance", value: "private" },
                                    { label: "Self-Pay / None", value: "self_pay" }
                                ]
                            },
                            { name: "insuranceId", label: "Member ID", type: "text", placeholder: "e.g. ABC12345678" }
                        ]
                    }}
                    onSubmit={handleSubmit}
                    submitLabel="Create Client Record"
                />
            </Card>
        </div>
    );
}
