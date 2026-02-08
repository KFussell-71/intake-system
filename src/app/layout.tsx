import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans } from 'next/font/google';
import "./globals.css";

const figtree = Figtree({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-figtree',
});

const notoSafe = Noto_Sans({
    subsets: ['latin'],
    weight: ['300', '400', '500', '700'],
    variable: '--font-noto-sans',
});

export const metadata: Metadata = {
    title: "New Beginning | Intake",
    description: "Premium social services client intake and tracking system",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "New Beginning",
    },
};

export const viewport: Viewport = {
    themeColor: "#4f46e5",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { PWARegister } from "@/components/providers/PWARegister";
import { GlobalSearchDialog } from "@/components/search/GlobalSearchDialog";
import { NetworkStatus } from "@/components/ui/NetworkStatus";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${figtree.variable} ${notoSafe.variable} antialiased`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <NetworkStatus />
                    <GlobalSearchDialog />
                    <PWARegister />
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </ThemeProvider>
            </body>
        </html>
    );
}
