import { supabase } from '@/lib/supabase';

export class AuthService {
    async signIn(email: string, password: string) {
        return await supabase.auth.signInWithPassword({ email, password });
    }

    async signOut() {
        return await supabase.auth.signOut();
    }

    async getCurrentUser() {
        return await supabase.auth.getUser();
    }
}

export const authService = new AuthService();
