
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TrainingContextType {
    isTrainingMode: boolean;
    setTrainingMode: (enabled: boolean) => void;
    activeGuide: string | null;
    startGuide: (guideId: string) => void;
    stopGuide: () => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
    const [isTrainingMode, setIsTrainingMode] = useState(false);
    const [activeGuide, setActiveGuide] = useState<string | null>(null);

    // Persist preference
    useEffect(() => {
        const stored = localStorage.getItem('training_mode_enabled');
        if (stored) setIsTrainingMode(JSON.parse(stored));
    }, []);

    const setMode = (enabled: boolean) => {
        setIsTrainingMode(enabled);
        localStorage.setItem('training_mode_enabled', JSON.stringify(enabled));
        if (!enabled) setActiveGuide(null);
    };

    return (
        <TrainingContext.Provider value={{
            isTrainingMode,
            setTrainingMode: setMode,
            activeGuide,
            startGuide: setActiveGuide,
            stopGuide: () => setActiveGuide(null)
        }}>
            {children}
            {/* We can inject the overlay here globally if we want, or let Layout handle it */}
        </TrainingContext.Provider>
    );
}

export function useTraining() {
    const context = useContext(TrainingContext);
    if (context === undefined) {
        throw new Error('useTraining must be used within a TrainingProvider');
    }
    return context;
}
