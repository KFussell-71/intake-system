import { createClient } from '@/lib/supabase/browser';

export class AuthService {
    private get supabase() {
        return createClient();
    }

    async signIn(email: string, password: string) {
        return await this.supabase.auth.signInWithPassword({ email, password });
    }

    async signUp(email: string, password: string) {
        try {
            const { data, error } = await this.supabase.auth.signUp({ email, password });
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
        return await this.supabase.auth.signOut();
    }

    async getCurrentUser() {
        return await this.supabase.auth.getUser();
    }
}

export const authService = new AuthService();
