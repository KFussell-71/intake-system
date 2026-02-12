import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPortalClientData } from '@/app/actions/portal/getPortalClientData';
import { getPortalMessagesAction, sendPortalMessageAction } from '@/app/actions/portal/messageActions';
import { MessageCenter } from '@/features/portal/components/MessageCenter';
import { PortalConcierge } from '@/features/portal/components/PortalConcierge';

/**
 * PORTAL DASHBOARD
 * 
 * Entry point for authenticated portal clients.
 * Verifies active portal access and displays sanitized client information.
 */
export default async function PortalHome() {
    // Get client data (includes access validation)
    const { success, error, data } = await getPortalClientData();

    // Fetch initial messages
    const portalMessagesResponse = await getPortalMessagesAction();
    const messages = portalMessagesResponse.data || [];

    // Handle access failures
    if (!success || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Access Not Authorized</h1>
                    <p className="text-slate-400 mb-4">{error || 'Unable to verify portal access.'}</p>
                    <Link
                        href="/portal/login"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    const { client, intake, milestones, documents, accessInfo } = data;

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-white mb-1">
                    Welcome, {client.name}
                </h1>
                <p className="text-slate-400 text-sm">
                    Your secure portal for managing documents and tracking your employment services progress.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Progress & Milestones */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{documents.length}</p>
                                    <p className="text-xs text-slate-400">Documents</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{milestones.filter((m: any) => m.completion_date).length}</p>
                                    <p className="text-xs text-slate-400">Milestones</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {intake?.status || 'Active'}
                                    </p>
                                    <p className="text-xs text-slate-400">Case Status</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/portal/documents"
                            className="group bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:bg-slate-700/50 hover:border-emerald-500/30 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-md font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                        Documents
                                    </h2>
                                    <p className="text-xs text-slate-400">Upload and manage files</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/portal/status"
                            className="group bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:bg-slate-700/50 hover:border-blue-500/30 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-md font-semibold text-white group-hover:text-blue-300 transition-colors">
                                        Progress
                                    </h2>
                                    <p className="text-xs text-slate-400">View case milestones</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Recent Milestones */}
                    {milestones.length > 0 && (
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Latest Progress</h2>
                            <div className="space-y-3">
                                {milestones.slice(0, 3).map((milestone: any) => (
                                    <div
                                        key={milestone.id}
                                        className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                                    >
                                        {milestone.completion_date ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-white font-medium">{milestone.milestone_name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                {milestone.completion_date
                                                    ? `Achieved ${new Date(milestone.completion_date).toLocaleDateString()}`
                                                    : 'Active Phase'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Support */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-white">Caseworker Support</h2>
                    </div>
                    <MessageCenter
                        clientId={client.id}
                        initialMessages={messages}
                        onSendMessage={async (content) => {
                            'use server';
                            const res = await sendPortalMessageAction(content);
                            return res.success;
                        }}
                    />

                    {/* Access Info */}
                    <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            Portal Access Security
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Expires: {new Date(accessInfo.expiresAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Assistant Widget */}
            <PortalConcierge />
        </div>
    );
}
