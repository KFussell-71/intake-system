
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { parseArgs } from 'node:util';

// Load Environment
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('Falling back to .env');
    dotenv.config({ path: '.env', override: true });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTenant() {
    console.log('🌱 Starting Tenant Seeding Sequence...');

    // 1. Parse Arguments (Name, Admin Email)
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            name: { type: 'string', default: 'New Beginning Options' },
            email: { type: 'string', default: 'admin@newbeginning.org' },
            password: { type: 'string', default: 'TemporaRy!23' }, // Force change later
        },
    });

    console.log(`📋 Configuration:`);
    console.log(`   - Agency Name: ${values.name}`);
    console.log(`   - Admin Email: ${values.email}`);

    // 2. Configure Agency Settings
    console.log('🏢 Configuring Agency Settings...');
    const { error: settingsError } = await supabase
        .from('agency_settings')
        .update({ agency_name: values.name })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all (singleton)

    // If update failed (maybe empty?), try insert
    if (settingsError) {
        // Fallback or ignore if table empty (migration should have seeded it, but checking)
        const { error: insertError } = await supabase
            .from('agency_settings')
            .insert({ agency_name: values.name });

        if (insertError) console.warn('   ⚠️ Could not set agency name:', insertError.message);
    }
    console.log('   ✅ Agency Name Set');

    // 3. Create Admin User
    console.log('👤 Creating/Verifying Admin User...');

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === values.email);

    let userId: string;

    if (existingUser) {
        console.log('   ℹ️ Admin user already exists. Updating role...');
        userId = existingUser.id;
    } else {
        console.log('   ✨ Creating new Admin user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: values.email,
            password: values.password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            console.error('   ❌ Failed to create admin:', createError.message);
            process.exit(1);
        }
        userId = newUser.user.id;
        console.log(`   ✅ User created (ID: ${userId})`);
    }

    // 4. Assign Admin Role (in Profiles/Metadata)
    // NOTE: Our schema uses public.profiles for roles, driven by User Metadata or Triggers.
    // Let's ensure public.profiles has 'admin'.

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (profileError) {
        console.error('   ❌ Failed to set admin role in profiles:', profileError.message);
    } else {
        console.log('   ✅ Admin privileges granted.');
    }

    console.log('🎉 Tenant Seeding Complete!');
    console.log('------------------------------------------------');
    console.log(`Login: ${values.email}`);
    console.log(`Password: ${values.password}`);
    console.log('------------------------------------------------');
}

seedTenant().catch(console.error);
