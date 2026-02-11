'use client';

import React from 'react';
import {
    User as UserIcon,
    Stethoscope,
    Target,
    GraduationCap,
    Briefcase,
    FileCheck
} from 'lucide-react';

export const INTAKE_STEPS = [
    { title: 'Identity', icon: <UserIcon className="w-4 h-4" /> },
    { title: 'Evaluation', icon: <Stethoscope className="w-4 h-4" /> },
    { title: 'Goals', icon: <Target className="w-4 h-4" /> },
    { title: 'Prep', icon: <GraduationCap className="w-4 h-4" /> },
    { title: 'Placement', icon: <Briefcase className="w-4 h-4" /> },
    { title: 'Review', icon: <FileCheck className="w-4 h-4" /> },
];
