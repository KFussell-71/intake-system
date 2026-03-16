import { authService, AuthService } from '../services/AuthService';

export class AuthController {
    constructor(private readonly service: AuthService = authService) { }

    async login(email: string, password: string) {
        try {
            const result: any = await this.service.signIn(email, password);
            if (result?.error) throw new Error(result.error);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }

    async signUp(email: string, password: string) {
        try {
            const result: any = await this.service.signUp(email, password);
            if (!result.success) throw new Error(result.error);
            return { success: true };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Signup failed'
            };
        }
    }

    async logout() {
        await this.service.signOut();
    }
}

export const authController = new AuthController();
