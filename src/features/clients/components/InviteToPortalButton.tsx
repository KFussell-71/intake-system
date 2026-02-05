'use client';

import { useState } from 'react';
import { inviteClientToPortal } from '@/app/actions/portal/inviteClientToPortal';
import { revokeClientPortalAccess } from '@/app/actions/portal/revokeClientPortalAccess';

interface InviteToPortalButtonProps {
    clientId: string;
    clientName: string;
    clientEmail?: string;
    hasActiveAccess?: boolean;
    expiresAt?: string;
    iconOnly?: boolean;
}

/**
 * Invite to Portal / Manage Access Button
 * 
 * Allows staff to invite clients to the portal or manage existing access.
 * Includes confirmation dialogs and loading states.
 */
export default function InviteToPortalButton({
    clientId,
    clientName,
    clientEmail,
    hasActiveAccess = false,
    expiresAt,
    iconOnly = false
}: InviteToPortalButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState(clientEmail || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Please enter an email address' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const result = await inviteClientToPortal(clientId, email.trim());

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Invitation sent!' });
                // Close modal after 2 seconds on success
                setTimeout(() => {
                    setShowModal(false);
                    setMessage(null);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to send invitation' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const result = await revokeClientPortalAccess(clientId, 'Manual revocation via client page');

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Access revoked' });
                setShowRevokeConfirm(false);
                // Refresh page after 1 second
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to revoke access' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    // Show active access state
    if (hasActiveAccess) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-400">Portal access active</span>
                </div>
                {expiresAt && (
                    <p className="text-xs text-slate-400">
                        Expires: {new Date(expiresAt).toLocaleDateString()}
                    </p>
                )}

                {!showRevokeConfirm ? (
                    <button
                        onClick={() => setShowRevokeConfirm(true)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        Revoke Access
                    </button>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-3">
                        <p className="text-sm text-red-300">
                            Revoke portal access for {clientName}?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRevoke}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm rounded-lg transition-colors"
                            >
                                {loading ? 'Revoking...' : 'Yes, Revoke'}
                            </button>
                            <button
                                onClick={() => setShowRevokeConfirm(false)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        {message && (
                            <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                }}
                className={iconOnly
                    ? "p-2 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                    : "inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                }
                title={iconOnly ? `Invite ${clientName} to Portal` : undefined}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {!iconOnly && "Invite to Portal"}
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">
                                Invite to Client Portal
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Send a secure magic-link to <strong className="text-white">{clientName}</strong> to access their client portal.
                        </p>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label htmlFor="portal-email" className="block text-sm font-medium text-white mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="portal-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="client@example.com"
                                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg ${message.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                                    }`}>
                                    <p className={`text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                                        }`}>
                                        {message.text}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all"
                                >
                                    {loading ? 'Sending...' : 'Send Invitation'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-slate-500">
                                Portal access expires after 30 days. The client will use a secure magic-link to log in - no password required.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
