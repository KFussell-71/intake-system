import { supabase } from '@/lib/supabase';

export class AuthService {
    async signIn(email: string, password: string) {
        // Add timeout to prevent hanging if Supabase is misconfigured
        const signInPromise = supabase.auth.signInWithPassword({ email, password });
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sign-in timeout - check Supabase configuration')), 10000)
        );
        
        return await Promise.race([signInPromise, timeoutPromise]) as any;
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
