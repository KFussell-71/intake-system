"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, X, ArrowRight, BookOpen, Users, FileText, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    actionUrl: string;
    completed: boolean;
}

export function GettingStartedWidget() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [items, setItems] = useState<ChecklistItem[]>([
        {
            id: 'profile',
            label: 'Complete Your Profile',
            description: 'Set up your signature and preferences.',
            icon: <UserCircle className="w-5 h-5 text-blue-500" />,
            actionUrl: '/settings',
            completed: false
        },
        {
            id: 'client',
            label: 'Add First Client',
            description: 'Create a new client record in the system.',
            icon: <Users className="w-5 h-5 text-emerald-500" />,
            actionUrl: '/intake/new', // Assuming this route or /clients
            completed: false
        },
        {
            id: 'template',
            label: 'Review Templates',
            description: 'Check out the default Intake Assessment forms.',
            icon: <FileText className="w-5 h-5 text-purple-500" />,
            actionUrl: '/forms', // Placeholder route, might need adjustment
            completed: false
        },
        {
            id: 'training',
            label: 'View Training',
            description: 'Watch the "Getting Started" class.',
            icon: <BookOpen className="w-5 h-5 text-amber-500" />,
            actionUrl: '#training', // Trigger dialog
            completed: false
        }
    ]);

    useEffect(() => {
        // Check if dismissed
        const dismissed = localStorage.getItem('onboarding_dismissed');
        if (!dismissed) {
            setIsVisible(true);

            // Rehydrate completion state from local storage
            const savedState = localStorage.getItem('onboarding_progress');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                setItems(prev => prev.map(item => ({
                    ...item,
                    completed: !!parsed[item.id]
                })));
            }
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('onboarding_dismissed', 'true');
    };

    const toggleItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation if clicking checkbox
        setItems(prev => {
            const newItems = prev.map(item =>
                item.id === id ? { ...item, completed: !item.completed } : item
            );

            // Save state
            const state = newItems.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.completed }), {});
            localStorage.setItem('onboarding_progress', JSON.stringify(state));

            return newItems;
        });
    };

    const handleAction = (item: ChecklistItem) => {
        if (item.actionUrl.startsWith('#')) {
            // Handle internal triggers like training dialog if possible, or just ignore for now
            if (item.id === 'training') {
                // Dispatch custom event or rely on user to open training manually
                alert("Open the Training Center from the top toolbar!");
            }
        } else {
            router.push(item.actionUrl);
        }
    };

    if (!isVisible) return null;

    const completedCount = items.filter(i => i.completed).length;
    const progress = Math.round((completedCount / items.length) * 100);

    return (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-blue-200 dark:border-blue-900 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-black/10 dark:hover:bg-white/10" onClick={handleDismiss}>
                    <X className="w-4 h-4 text-slate-500" />
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="md:w-1/3 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                        Getting Started
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                        Welcome to Case Management Hub
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Follow these steps to set up your workspace and start managing client outcomes effectively.
                    </p>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-blue-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`
                                group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
                                ${item.completed
                                    ? 'bg-white/60 dark:bg-slate-800/60 border-transparent opacity-75'
                                    : 'bg-white dark:bg-slate-900 border-white/50 shadow-sm hover:shadow-md hover:border-blue-300'
                                }
                            `}
                            onClick={() => handleAction(item)}
                        >
                            <div
                                className={`mt-1 flex-shrink-0 cursor-pointer transition-colors ${item.completed ? 'text-blue-600' : 'text-slate-300 hover:text-blue-400'}`}
                                onClick={(e) => toggleItem(item.id, e)}
                            >
                                {item.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </div>

                            <div className="flex-1">
                                <h4 className={`font-bold transition-all ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {item.label}
                                </h4>
                                <p className="text-sm text-slate-500 leading-snug mt-1">
                                    {item.description}
                                </p>
                            </div>

                            <div className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${item.completed ? 'hidden' : ''}`}>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
