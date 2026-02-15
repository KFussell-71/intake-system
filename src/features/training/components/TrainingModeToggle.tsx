"use client";

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainingMode } from '@/context/TrainingContext';
import { GraduationCap } from 'lucide-react';

export const TrainingModeToggle = () => {
    const { isTrainingMode, toggleTrainingMode } = useTrainingMode();

    return (
        <div className="flex items-center space-x-2 bg-secondary/20 p-2 rounded-lg border border-secondary/30">
            <GraduationCap className={`h-4 w-4 ${isTrainingMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex items-center space-x-2">
                <Switch
                    id="training-mode"
                    checked={isTrainingMode}
                    onCheckedChange={toggleTrainingMode}
                />
                <Label htmlFor="training-mode" className="text-sm font-medium cursor-pointer">
                    Training Mode
                </Label>
            </div>
        </div>
    );
};
