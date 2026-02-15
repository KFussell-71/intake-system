import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export class AuthService {
    async signIn(email: string, password: string) {
        return await supabase.auth.signInWithPassword({ email, password });
    }

    async signUp(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Signup failed'
            };
        }
    }

    async signOut() {
        return await supabase.auth.signOut();
    }

    async getCurrentUser() {
        return await supabase.auth.getUser();
    }
}

export const authService = new AuthService();
