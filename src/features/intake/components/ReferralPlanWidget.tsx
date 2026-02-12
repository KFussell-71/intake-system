import React, { useState } from 'react';
import { MapPin, Phone, ExternalLink, Sparkles, CheckCircle, Loader2, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { generateIntakeReferralPlan } from '@/app/actions/referralActions';
import { ReferralPlan, Referral } from '@/domain/services/ClinicalResourceCoordinator';

interface Props {
    intakeId: string;
}

export const ReferralPlanWidget: React.FC<Props> = ({ intakeId }) => {
    const [plan, setPlan] = useState<ReferralPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateIntakeReferralPlan(intakeId);
            setPlan(result);
        } catch (err) {
            setError('Failed to generate referral plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="p-6 border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">AV Clinical Resource Coordinator</h3>
                        <p className="text-sm text-slate-500">Localized AI Referral Engine (Antelope Valley)</p>
                    </div>
                </div>
                {!plan && !loading && (
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        Analyze & Refer
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                        Scanning AV Resource Map...
                    </p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600">
                    <Info className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {plan && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                            &quot;{plan.summary}&quot;
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.referrals.map((referral, idx) => (
                            <ReferralCard key={idx} referral={referral} />
                        ))}
                    </div>

                    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Counselor Action Items
                        </h4>
                        <ul className="space-y-2">
                            {plan.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                        Re-Analyze Data
                    </button>
                </div>
            )}
        </GlassCard>
    );
};

const ReferralCard: React.FC<{ referral: Referral }> = ({ referral }) => {
    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${referral.category === 'career' ? 'bg-green-100 text-green-700' :
                    referral.category === 'medical' ? 'bg-red-100 text-red-700' :
                        referral.category === 'housing' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                    }`}>
                    {referral.category}
                </span>
            </div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                {referral.title}
            </h5>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                {referral.description}
            </p>

            <div className="space-y-1.5">
                {referral.address && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{referral.address}</span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700/50 mt-2">
                    <span className="text-[10px] font-bold text-indigo-500">{referral.action}</span>
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
};
