
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPortalUser() {
    try {
        console.log("Seeding test portal user...");

        const email = 'portal_test@example.com';
        const password = 'Password123!';

        // 1. Create/Get User
        const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        }).catch(async (e) => {
            console.log("User might exist, trying to fetch...");
            // Actually, listing users by email is safer
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users.users.find(u => u.email === email);
            return { data: { user: existing }, error: null };
        });

        let targetUser = user;
        if (userError) {
            console.log("Create user failed (likely exists):", userError.message);
            const { data: users } = await supabase.auth.admin.listUsers();
            targetUser = users.users.find(u => u.email === email);
        }

        if (!targetUser) {
            console.error("Could not obtain user");
            return;
        }

        console.log("User ID:", targetUser.id);

        // 2. Create Client Record
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                name: 'Portal Test Client',
                email: email,
                phone: '555-0100',
                created_by: targetUser.id
            })
            .select()
            .single();

        if (clientError) {
            console.log("Client creation failed (likely exists):", clientError.message);
        }

        // Fetch latest client for this email
        const { data: existingClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
        const finalById = existingClient?.id || client?.id;

        if (!finalById) {
            console.error("Could not obtain client record");
            return;
        }

        console.log("Client ID:", finalById);

        // 3. Link User to Client (client_users)
        const { error: linkError } = await supabase
            .from('client_users')
            .upsert({
                id: targetUser.id,
                client_id: finalById,
                is_active: true
            });

        if (linkError) {
            console.error("Link error:", linkError);
        } else {
            console.log("Portal Access Linked Successfully!");
            console.log("Credentials -> Email:", email, "Password:", password);
        }

    } catch (err) {
        console.error("Seeding failed:", err);
    }
}

seedPortalUser();
