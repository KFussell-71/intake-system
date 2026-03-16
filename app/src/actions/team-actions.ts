'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { prisma, verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

/**
 * Server Action: Invite a new team member.
 * MIGRATED WITH AUDITING
 */
export async function inviteTeamMember(data: { email: string; fullName: string; role: Role }) {
    const auth = await verifyAuthorization(['admin', 'supervisor']);
    if (!auth.authorized || !auth.userId) throw new Error('Insufficient permissions');

    try {
        // 1. Invite User via Supabase Admin Auth
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
            data: {
                full_name: data.fullName,
                role: data.role
            }
        });

        if (inviteError) throw new Error(inviteError.message);

        // 2. Upsert Profile using Prisma
        if (authData.user) {
            const profile = await prisma.profile.upsert({
                where: { id: authData.user.id },
                update: {
                    fullName: data.fullName,
                    role: data.role
                },
                create: {
                    id: authData.user.id,
                    username: data.email, // using email as initial username
                    fullName: data.fullName,
                    role: data.role
                }
            });

            // 3. Audit Log
            await auditService.log({
                userId: auth.userId,
                action: 'CREATE',
                entityType: 'profile',
                entityId: profile.id,
                details: { invitedEmail: data.email, role: data.role }
            });
        }

        revalidatePath('/supervisor/dashboard');
        return { success: true };

    } catch (error: any) {
        console.error('Invite Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update team member role.
 * MIGRATED WITH AUDITING
 */
export async function updateTeamMemberRole(userId: string, newRole: Role) {
    const auth = await verifyAuthorization(['admin', 'supervisor']);
    if (!auth.authorized || !auth.userId) throw new Error('Insufficient permissions');

    try {
        // 1. Update Profile using Prisma
        const profile = await prisma.profile.update({
            where: { id: userId },
            data: { role: newRole }
        });

        // 2. Update Auth Metadata via Supabase Admin (for JWT consistency)
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        // 3. Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'UPDATE',
            entityType: 'profile',
            entityId: userId,
            details: { newRole }
        });

        revalidatePath('/supervisor/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Role Update Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get all team members using Prisma.
 */
export async function getTeamMembers() {
    const auth = await verifyAuthorization(['admin', 'supervisor']);
    if (!auth.authorized) throw new Error('Unauthorized');

    try {
        return await prisma.profile.findMany({
            orderBy: { fullName: 'asc' }
        });
    } catch (error) {
        console.error('Fetch Team Error:', error);
        return [];
    }
}
