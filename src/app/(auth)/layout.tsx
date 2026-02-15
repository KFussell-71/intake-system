import type { Metadata } from 'next';
import { Figtree, Noto_Sans } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from 'sonner';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const notoSafe = Noto_Sans({ subsets: ['latin'], variable: '--font-noto-sans' });

export const metadata: Metadata = {
    title: 'New Beginning | Sign In',
    description: 'Secure Access Portal',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${figtree.variable} ${notoSafe.variable} antialiased`} suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
