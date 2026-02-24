"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { modernizedIntakeRepository } from "@/repositories/ModernizedIntakeRepository";

export interface AVResource {
    id?: string;
    name: string;
    address: string;
    phone: string;
    notes: string;
    triggers: string[];
}

export async function getResources() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("av_resources")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
    return data as AVResource[];
}

export async function createResource(resource: AVResource) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("av_resources")
        .insert([resource])
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create resource: ${error.message}`);
    }
    revalidatePath("/supervisor/resources");

    // Audit Log
    const { data: { user } } = await supabase.auth.getUser();
    if (data) {
        await modernizedIntakeRepository.logIntakeEvent({
            intake_id: "RESOURCES",
            event_type: 'resource_created',
            new_value: (data as any).name,
            changed_by: user?.id || "SYSTEM",
            field_path: "av_resources"
        });
    }

    return data;
}

export async function updateResource(id: string, resource: Partial<AVResource>) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("av_resources")
        .update(resource)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update resource: ${error.message}`);
    }
    revalidatePath("/supervisor/resources");

    // Audit Log
    const { data: { user } } = await supabase.auth.getUser();
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: "RESOURCES",
        event_type: 'resource_updated',
        new_value: id,
        changed_by: user?.id || "SYSTEM",
        field_path: "av_resources"
    });

    return data;
}

export async function deleteResource(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("av_resources").delete().eq("id", id);

    if (error) {
        throw new Error(`Failed to delete resource: ${error.message}`);
    }
    revalidatePath("/supervisor/resources");

    // Audit Log
    const { data: { user } } = await supabase.auth.getUser();
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: "RESOURCES",
        event_type: 'resource_deleted',
        new_value: id,
        changed_by: user?.id || "SYSTEM",
        field_path: "av_resources"
    });
}
