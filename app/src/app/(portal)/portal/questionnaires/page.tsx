import Link from 'next/link';

/**
 * PORTAL QUESTIONNAIRES PAGE
 * 
 * Placeholder for future questionnaire functionality.
 * Clients will be able to complete assigned questionnaires here.
 */
export default function PortalQuestionnaires() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <nav className="text-sm text-slate-400 mb-2" aria-label="Breadcrumb">
                    <Link href="/portal" className="hover:text-white transition-colors">Dashboard</Link>
                    <span className="mx-2">/</span>
                    <span className="text-white">Questionnaires</span>
                </nav>
                <h1 className="text-2xl font-bold text-white">Questionnaires</h1>
                <p className="text-slate-400 mt-1">
                    Complete questionnaires assigned by your Employment Specialist.
                </p>
            </div>

            {/* Coming Soon */}
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-white mb-2">
                    No Questionnaires Assigned
                </h2>
                <p className="text-slate-400 max-w-md mx-auto">
                    When your Employment Specialist assigns a questionnaire, it will appear here for you to complete.
                </p>

                <Link
                    href="/portal"
                    className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>

            {/* Info */}
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-400">
                        Questionnaire responses help your Employment Specialist understand your needs and goals better. All responses are kept confidential.
                    </p>
                </div>
            </div>
        </div>
    );
}
