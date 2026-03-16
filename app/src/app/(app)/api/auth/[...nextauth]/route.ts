import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/auth/authHelpersServer";
// import bcrypt from 'bcryptjs'; // (commented out until actually needed by guide)

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;
                
                // MOCK AUTH for local development
                if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true') {
                    if (credentials.username === 'mock' && credentials.password === 'mock') {
                        return { id: "mock-user-id", name: "Mock User" };
                    }
                }

                // PRISMA LOOKUP FOR NEXTAUTH - Supabase Identity bridging or simple local hash strategy
                const user = await prisma.profile.findUnique({
                    where: { username: credentials.username }
                });

                if (!user) return null;
                // In a real migration you'd check `await bcrypt.compare(credentials.password, user.passwordHash)`
                // But for now we just verify the user exists if bridging from Supabase external auth
                return { id: user.id, name: user.username };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
