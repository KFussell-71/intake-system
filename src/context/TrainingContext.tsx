"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TrainingContextType {
    isTrainingMode: boolean;
    toggleTrainingMode: () => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
    const [isTrainingMode, setIsTrainingMode] = useState(false);

    const toggleTrainingMode = () => setIsTrainingMode(prev => !prev);

    return (
        <TrainingContext.Provider value={{ isTrainingMode, toggleTrainingMode }}>
            {children}
        </TrainingContext.Provider>
    );
};

export const useTrainingMode = () => {
    const context = useContext(TrainingContext);
    if (!context) {
        throw new Error('useTrainingMode must be used within a TrainingProvider');
    }
    return context;
};
