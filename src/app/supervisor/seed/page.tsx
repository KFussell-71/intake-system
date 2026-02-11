"use client";

import { AV_RESOURCES } from "@/data/av_resources";
import { createResource } from "@/app/actions/resourceActions";
import { useState } from "react";
import { toast } from "sonner";

export default function SeedPage() {
    const [status, setStatus] = useState("Ready to seed");

    const handleSeed = async () => {
        setStatus("Seeding...");
        let count = 0;
        try {
            for (const resource of AV_RESOURCES) {
                await createResource(resource);
                count++;
            }
            setStatus(`Successfully seeded ${count} resources!`);
            toast.success(`Seeded ${count} resources`);
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}. Make sure you are logged in if RLS requires it, and Migration is applied.`);
            toast.error("Seeding failed");
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
            <p className="mb-4">Click below to populate the `av_resources` table with the initial data.</p>
            <button
                onClick={handleSeed}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Seed Database
            </button>
            <p className="mt-4 font-mono">{status}</p>
        </div>
    );
}
