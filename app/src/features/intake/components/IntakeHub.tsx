'use client';

import React, { useState } from 'react';
import { IntakeDashboard } from './IntakeDashboard';
import { ModernizedIntakeStepIdentity } from './ModernizedIntakeStepIdentity';
import { ModernizedMedicalSection } from './ModernizedMedicalSection';
import { ModernizedEmploymentSection } from './ModernizedEmploymentSection';
import { ModernizedBarriersSection } from './ModernizedBarriersSection';
import { ModernizedObservationsSection } from './ModernizedObservationsSection';
import { ModernizedConsentSection } from './ModernizedConsentSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    intakeId: string;
}

type View = 'dashboard' | 'identity' | 'medical' | 'employment' | 'barriers' | 'observations' | 'consent';

export const IntakeHub: React.FC<Props> = ({ intakeId }) => {
    const [view, setView] = useState<View>('dashboard');

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <IntakeDashboard intakeId={intakeId} onNavigate={(v) => setView(v as View)} />;
            case 'identity':
                return <ModernizedIntakeStepIdentity intakeId={intakeId} onComplete={() => setView('dashboard')} />;
            case 'medical':
                return <ModernizedMedicalSection intakeId={intakeId} />;
            case 'employment':
                return <ModernizedEmploymentSection intakeId={intakeId} />;
            case 'barriers':
                return <ModernizedBarriersSection intakeId={intakeId} />;
            case 'observations':
                return <ModernizedObservationsSection intakeId={intakeId} />;
            case 'consent':
                return <ModernizedConsentSection intakeId={intakeId} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Hub Header */}
            {view !== 'dashboard' && (
                <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                    <Button variant="ghost" onClick={() => setView('dashboard')} className="hover:bg-primary/5">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="font-semibold uppercase tracking-wider">{view} Domain</span>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>

            {/* Global Actions (Drafting) */}
            <div className="fixed bottom-6 right-6">
                <Button className="shadow-2xl rounded-full h-14 px-6 gap-2 bg-gradient-to-r from-primary to-blue-600">
                    <Save className="w-5 h-5" />
                    <span>Smart Save</span>
                </Button>
            </div>
        </div>
    );
};
