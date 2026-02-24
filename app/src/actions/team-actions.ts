'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types';
import { revalidatePath } from 'next/cache';

export async function inviteTeamMember(data: { email: string; fullName: string; role: Profile['role'] }) {
    const supabase = await createClient();
    try {
        // 1. Verify caller is a Supervisor or Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: callerProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!callerProfile || !['admin', 'supervisor'].includes(callerProfile.role)) {
            throw new Error('Insufficient permissions');
        }

        // 2. Invite User via Supabase Admin Auth
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
            data: {
                full_name: data.fullName,
                role: data.role
            }
        });

        if (inviteError) {
            // Handle case where user already exists (maybe just update role logic?)
            // For now, fail safely.
            throw new Error(inviteError.message);
        }

        // 3. Upsert Profile (Trigger handles this usually, but we ensure role is set)
        // Since the trigger might only run on INSERT, we want to ensure data is correct.
        // Wait, inviteUserByEmail triggers 'on_auth_user_created' if it creates a user? 
        // Yes, but let's be safe and explicitly update the profile if the trigger logic is simple.
        // Actually, the trigger I wrote handles insert. Let's trust the auth metadata + trigger for now.
        // However, if the user already existed in Auth but not in Profiles (rare), we might need manual handling.

        // For robustness, let's explicit update/insert the profile using admin client to set the role/name
        // in case the trigger didn't catch 100% of metadata or if we want to overwrite.
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: data.email,
                    full_name: data.fullName,
                    role: data.role
                });
            if (profileError) console.error('Profile upsert error:', profileError);
        }

        revalidatePath('/supervisor/dashboard');
        return { success: true };

    } catch (error) {
        console.error('Invite Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Detailed error hidden' };
    }
}

export async function updateTeamMemberRole(userId: string, newRole: Profile['role']) {
    const supabase = await createClient();
    try {
        // 1. Verify caller
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: callerProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!callerProfile || !['admin', 'supervisor'].includes(callerProfile.role)) {
            throw new Error('Insufficient permissions');
        }

        // 2. Update Profile
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        // 3. Update Auth Metadata (so JWT is correct on next refresh)
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        revalidatePath('/supervisor/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
}

export async function getTeamMembers() {
    const supabase = await createClient();
    // RLS Policy "Supervisors can view all profiles" should allow this via standard client
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Fetch Team Error:', error);
        return [];
    }
    return data as Profile[];
}
