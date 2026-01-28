import type { Metadata } from "next";
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
    title: "Social Services Intake",
    description: "Nonprofit social services client intake and tracking system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${figtree.variable} ${notoSafe.variable} antialiased`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
