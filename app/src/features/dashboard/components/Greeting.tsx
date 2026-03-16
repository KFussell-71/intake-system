'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CloudSun, Heart, Star, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface GreetingProps {
    user: User | null;
}

export const Greeting: React.FC<GreetingProps> = ({ user }) => {
    const [greeting, setGreeting] = useState('');
    const [icon, setIcon] = useState<React.ReactNode>(null);
    const [theme, setTheme] = useState<'default' | 'valentine' | 'mlk' | 'halloween' | 'christmas' | 'newyear' | 'independence' | 'thanksgiving'>('default');

    useEffect(() => {
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth() + 1; // 1-12
        const date = now.getDate();

        // Time of Day Logic
        if (hour < 12) {
            setGreeting('Good morning');
            setIcon(<CloudSun className="w-8 h-8 text-amber-400" />);
        } else if (hour < 18) {
            setGreeting('Good afternoon');
            setIcon(<Sun className="w-8 h-8 text-orange-500" />);
        } else {
            setGreeting('Good evening');
            setIcon(<Moon className="w-8 h-8 text-indigo-400" />);
        }

        // Holiday Logic
        // New Year's (Jan 1)
        if (month === 1 && date === 1) {
            setTheme('newyear');
        }
        // MLK Day (3rd Mon in Jan)
        else if (month === 1 && isNthDayOfWeek(now, 1, 3)) { // 1 = Monday, 3 = 3rd
            setTheme('mlk');
        }
        // Valentine's Day (Feb 14)
        else if (month === 2 && date === 14) {
            setTheme('valentine');
        }
        // 4th of July
        else if (month === 7 && date === 4) {
            setTheme('independence');
        }
        // Halloween (Oct 31)
        else if (month === 10 && date === 31) {
            setTheme('halloween');
        }
        // Thanksgiving (4th Thurs in Nov)
        else if (month === 11 && isNthDayOfWeek(now, 4, 4)) { // 4 = Thursday, 4 = 4th
            setTheme('thanksgiving');
        }
        // Christmas (Dec 25)
        else if (month === 12 && date === 25) {
            setTheme('christmas');
        }
    }, []);

    // Helper to calc Nth Day of Week (e.g. 3rd Monday)
    const isNthDayOfWeek = (date: Date, dayOfWeek: number, n: number) => {
        if (date.getDay() !== dayOfWeek) return false;
        const currentDay = date.getDate();
        // The nth occurrence happens between (n-1)*7 + 1 and n*7
        return currentDay > (n - 1) * 7 && currentDay <= n * 7;
    };

    const name = user?.email?.split('@')[0] || 'User';

    const getThemeIcon = () => {
        switch (theme) {
            case 'valentine': return <Heart className="w-6 h-6 text-pink-300/50 fill-pink-300/30" />;
            case 'christmas': return <Sparkles className="w-6 h-6 text-emerald-300/50 fill-white/30" />;
            case 'halloween': return <span className="text-2xl opacity-50">🎃</span>;
            case 'independence': return <Star className="w-6 h-6 text-blue-400/50 fill-red-400/30" />;
            case 'newyear': return <Sparkles className="w-6 h-6 text-yellow-300/50" />;
            case 'mlk': return <span className="text-2xl opacity-50">🕊️</span>;
            case 'thanksgiving': return <span className="text-2xl opacity-50">🦃</span>;
            default: return null;
        }
    };

    const getGreetingIcon = () => {
        switch (theme) {
            case 'valentine': return <Heart className="w-8 h-8 text-pink-500 fill-pink-500 inline-block" />;
            case 'christmas': return <span className="text-3xl">🎄</span>;
            case 'halloween': return <span className="text-3xl">👻</span>;
            case 'independence': return <span className="text-3xl">🎆</span>;
            case 'newyear': return <span className="text-3xl">🥂</span>;
            default: return null;
        }
    };

    return (
        <div className="relative">
            {/* Holiday Background Animations */}
            {theme !== 'default' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 100, opacity: 0, scale: 0.5 }}
                            animate={{
                                y: -100,
                                opacity: [0, 1, 0],
                                scale: [0.5, 1, 0.5],
                                x: Math.sin(i) * 50
                            }}
                            transition={{
                                duration: 4 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "linear"
                            }}
                            className="absolute bottom-0"
                            style={{ left: `${20 + i * 15}%` }}
                        >
                            {getThemeIcon()}
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-inner">
                    {icon}
                </div>
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-1 leading-tight flex items-center gap-3">
                        {greeting},
                        {theme !== 'default' && getGreetingIcon() && (
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                {getGreetingIcon()}
                            </motion.span>
                        )}
                    </h2>
                    <p className="text-3xl md:text-5xl font-bold text-white/90">
                        {name}
                    </p>
                </div>
            </div>
        </div>
    );
};
