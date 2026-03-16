'use server';

import { prisma, verifyAuthentication } from "@/lib/auth/authHelpersServer";
import { logFollowUpStatusChanged } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Update follow-up status using Prisma.
 * Enforces ownership/assignment checks.
 */
export async function updateFollowUpStatus(followUpId: string, status: 'pending' | 'completed') {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error("Unauthorized");

    try {
        // 1. Fetch Follow-up with client associations to verify ownership
        const followUp = await prisma.followUp.findUnique({
            where: { id: followUpId },
            include: {
                client: {
                    select: {
                        assignedToId: true,
                        createdById: true
                    }
                }
            }
        });

        if (!followUp) {
            throw new Error("Follow-up not found");
        }

        // 2. Permission check: assigned staff or creator
        const isOwner = followUp.client.assignedToId === auth.userId || followUp.client.createdById === auth.userId;
        if (!isOwner) throw new Error("Unauthorized: You are not assigned to this client");

        // 3. Perform update
        await prisma.followUp.update({
            where: { id: followUpId },
            data: { status }
        });

        // 4. Traceability: Log status change for audit trail
        await logFollowUpStatusChanged(followUpId, status);

        revalidatePath('/follow-ups');
        return { success: true };

    } catch (error: any) {
        console.error('Error updating follow-up status:', error);
        return { success: false, error: error.message };
    }
}
