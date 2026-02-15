"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { modernizedIntakeRepository } from "@/repositories/ModernizedIntakeRepository";

export interface SystemMemoryLog {
    id?: string;
    action_type: 'Correction' | 'Skill' | 'Action' | 'Generation';
    description: string;
    metadata?: any;
    created_at?: string;
    created_by?: string;
}

export async function logSystemAction(log: Omit<SystemMemoryLog, 'id' | 'created_at'>) {
    const supabase = createClient();
    const { error } = await supabase.from("system_memory").insert([log]);

    if (error) {
        console.error("Failed to log system action:", error);
        // Don't throw, failing to log shouldn't break the app flow usually
    } else {
        revalidatePath("/supervisor/memory");

        // Audit Log
        await modernizedIntakeRepository.logIntakeEvent({
            intake_id: "SYSTEM",
            event_type: 'system_memory_log',
            new_value: log.description,
            changed_by: log.created_by || "SYSTEM",
            field_path: "system_memory"
        });
    }
}

export async function getSystemLogs() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("system_memory")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Get last 50 actions

    if (error) {
        console.error("Failed to fetch system logs:", error);
        return [];
    }
    return data as SystemMemoryLog[];
}
