import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@/app/globals.css';

export const metadata: Metadata = {
    title: 'Client Portal | DOR Employment Services',
    description: 'Secure client portal for Department of Rehabilitation Employment Services',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#1e293b',
};

interface PortalLayoutProps {
    children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Portal Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Client Portal</h1>
                            <p className="text-xs text-slate-400">DOR Employment Services</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/portal"
                            className="text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/portal/documents"
                            className="text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            Documents
                        </Link>
                        <Link
                            href="/portal/status"
                            className="text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            Status
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-auto">
                <div className="max-w-5xl mx-auto px-4 py-6 text-center">
                    <p className="text-sm text-slate-400">
                        Need help? Contact your Employment Specialist
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                        This is a secure portal. All activity is logged.
                    </p>
                </div>
            </footer>
        </div>
    );
}
