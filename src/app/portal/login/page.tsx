/**
 * PORTAL LOGIN PAGE
 * 
 * This page displays information about how to access the portal.
 * There is NO login form - access is via magic-link only.
 * 
 * SECURITY: No credentials collected, no authentication attempts possible.
 */

export default function PortalLogin() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Secure Client Portal
                    </h1>

                    <p className="text-slate-400 text-center mb-6">
                        Department of Rehabilitation Employment Services
                    </p>

                    {/* Security Notice */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div>
                                <p className="text-sm text-emerald-300 font-medium">
                                    Passwordless Security
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Access is provided through a secure one-time link sent by your Employment Specialist. No passwords are used.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4 text-sm text-slate-300">
                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</span>
                            <p>Check your email for a secure access link from your Employment Specialist</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</span>
                            <p>Click the link to access your personalized portal</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</span>
                            <p>Links expire after 30 days for your security</p>
                        </div>
                    </div>

                    {/* Help */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-center text-sm text-slate-400">
                            Need access? Contact your Employment Specialist to receive a secure login link.
                        </p>
                    </div>
                </div>

                {/* Accessibility Note */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    This portal is designed to meet WCAG 2.1 Level AA accessibility standards.
                </p>
            </div>
        </div>
    );
}
