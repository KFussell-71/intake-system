import Link from 'next/link';
import { getPortalClientData } from '@/app/actions/portal/getPortalClientData';

/**
 * PORTAL STATUS PAGE
 * 
 * Displays case milestones and progress for portal clients.
 * Shows a sanitized view of their case status and achievements.
 */
export default async function PortalStatus() {
    const { success, error, data } = await getPortalClientData();

    if (!success || !data) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">{error || 'Unable to load status information.'}</p>
                    <Link
                        href="/portal"
                        className="mt-4 inline-block text-emerald-400 hover:text-emerald-300"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const { client, intake, milestones } = data;

    // Group milestones by completion status (using completion_date presence)
    const achievedMilestones = milestones.filter((m: any) => !!m.completion_date);
    const inProgressMilestones = milestones.filter((m: any) => !m.completion_date);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <nav className="text-sm text-slate-400 mb-2" aria-label="Breadcrumb">
                    <Link href="/portal" className="hover:text-white transition-colors">Dashboard</Link>
                    <span className="mx-2">/</span>
                    <span className="text-white">Status</span>
                </nav>
                <h1 className="text-2xl font-bold text-white">Your Progress</h1>
                <p className="text-slate-400 mt-1">
                    Track your employment services milestones and achievements.
                </p>
            </div>

            {/* Current Status Card */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Current Case Status</p>
                        <p className="text-xl font-semibold text-white">
                            {intake?.status || 'In Progress'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-400">{achievedMilestones.length}</p>
                    <p className="text-sm text-slate-400 mt-1">Completed</p>
                </div>
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400">{inProgressMilestones.length}</p>
                    <p className="text-sm text-slate-400 mt-1">In Progress</p>
                </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-6">
                {/* Achieved Milestones */}
                {achievedMilestones.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed Milestones
                        </h2>
                        <div className="space-y-3">
                            {achievedMilestones.map((milestone) => (
                                <div
                                    key={milestone.id}
                                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{milestone.milestone_name}</p>
                                            {milestone.completion_date && (
                                                <p className="text-sm text-emerald-400/70">
                                                    Achieved {new Date(milestone.completion_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* In Progress Milestones */}
                {inProgressMilestones.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            In Progress
                        </h2>
                        <div className="space-y-3">
                            {inProgressMilestones.map((milestone) => (
                                <div
                                    key={milestone.id}
                                    className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{milestone.milestone_name}</p>
                                            <p className="text-sm text-slate-400">
                                                In progress
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Milestones */}
                {milestones.length === 0 && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-slate-400">
                            No milestones have been set yet. Your Employment Specialist will update your progress as your case develops.
                        </p>
                    </div>
                )}
            </div>

            {/* Help Info */}
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-400 text-center">
                    Questions about your progress? Contact your Employment Specialist for more details.
                </p>
            </div>
        </div>
    );
}
