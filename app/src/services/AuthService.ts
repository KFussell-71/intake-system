import { signIn, signOut } from 'next-auth/react';

export class AuthService {
    async signIn(email: string, password: string) {
        return await signIn('credentials', { 
            email, 
            password, 
            redirect: false 
        });
    }

    async signUp(email: string, password: string) {
        // Sign-up is typically a server action now to create the record in Prisma
        // For now, return a placeholder or redirect to register
        return { success: false, error: 'Signup must be performed via server action' };
    }

    async signOut() {
        return await signOut({ redirect: false });
    }

    async getCurrentUser() {
        // In NextAuth Client, we use useSession() hook instead of a service method
        // But for compatibility with existing code:
        return null; 
    }
}

export const authService = new AuthService();
