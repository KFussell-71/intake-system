'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageCircle, Send, Bot } from 'lucide-react';
import { getConciergeResponseAction } from '@/app/actions/portal/getConciergeResponseAction';

interface Props {
    clientName: string;
    milestones: any[];
    documentRequests: any[];
}

export const PortalConcierge = ({ clientName, milestones, documentRequests }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
        { role: 'ai', content: `Hi ${clientName.split(' ')[0]}! I'm your AI Concierge. How can I help you regarding your milestones or documents today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Generate suggested questions based on context
    const activeMilestone = milestones.find((m: any) => !m.completion_date);
    const pendingDocs = documentRequests.filter((d: any) => d.status === 'pending');

    const suggestions = [
        activeMilestone ? `What does "${activeMilestone.milestone_name}" involve?` : null,
        pendingDocs.length > 0 ? `Why do I need to upload a ${pendingDocs[0].name}?` : null,
        "What is my next step?",
        "Contact my caseworker"
    ].filter(Boolean) as string[];

    const handleSend = async (text?: string) => {
        const userMsg = text || input;
        if (!userMsg.trim() || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await getConciergeResponseAction(userMsg);
            if (res.success && res.data) {
                setMessages(prev => [...prev, { role: 'ai', content: res.data }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: 'I encountered an issue. Please try again or message your caseworker.' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white z-50 border border-white/20"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                )}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">AI Concierge</h3>
                                <p className="text-[10px] text-slate-400">Personalized Case Support</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`
                                        max-w-[85%] p-3 rounded-xl text-xs
                                        ${msg.role === 'ai'
                                            ? 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'
                                            : 'bg-indigo-600 text-white rounded-br-none'}
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none animate-pulse">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Suggested Questions (only show if no loading and last msg is AI) */}
                            {!isLoading && messages[messages.length - 1]?.role === 'ai' && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(s)}
                                            className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything about your case..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="mt-2 text-[9px] text-slate-500 text-center uppercase tracking-widest">
                                Intelligent Support Widget
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
