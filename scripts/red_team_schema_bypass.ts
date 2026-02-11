
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function attemptBypass() {
    console.log("Attempting Schema Bypass...");
    const invalidData = {
        p_name: "Red Team Bypass",
        p_intake_data: {
            clientName: "Red Team Bypass",
            consentToRelease: false, // INVALID: Schema requires true
            // Missing other required fields
        }
    };

    const { data, error } = await supabase.rpc('create_client_with_intake', invalidData);

    if (error) {
        console.log("Bypass Failed (Good):", error.message);
    } else {
        console.log("Bypass Succeeded (Bad):", data);
    }
}

attemptBypass();
