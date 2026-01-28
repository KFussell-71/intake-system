import { authService, AuthService } from '../services/AuthService';

export class AuthController {
    constructor(private readonly service: AuthService = authService) { }

    async login(email: string, password: string) {
        try {
            const { data, error } = await this.service.signIn(email, password);
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }

    async logout() {
        await this.service.signOut();
    }
}

export const authController = new AuthController();
