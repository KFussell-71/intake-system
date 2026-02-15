import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans } from 'next/font/google';
import "../globals.css";

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

// Force dynamic for all app routes (protected)
export const dynamic = 'force-dynamic';

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { PWARegister } from "@/components/providers/PWARegister";
import { GlobalSearchWrapper } from "@/components/search/GlobalSearchWrapper";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { Toaster } from 'sonner';

import { TrainingProvider } from "@/features/training/context/TrainingContext";
import { TrainingOverlay } from "@/features/training/components/TrainingOverlay";

export default function AppLayout({
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
                    <TrainingProvider>
                        <NetworkStatus />
                        <GlobalSearchWrapper />
                        <PWARegister />
                        <TrainingOverlay />
                        <ErrorBoundary>
                            {children}
                            <Toaster />
                        </ErrorBoundary>
                    </TrainingProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
