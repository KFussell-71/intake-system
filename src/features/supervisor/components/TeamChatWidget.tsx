'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Video, Phone, Search, Users, ShieldAlert, FileText, X, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
    id: string;
    sender: 'me' | 'other';
    name: string;
    avatar?: string;
    content: string;
    timestamp: string;
    isSaved?: boolean;
}

// Client-Side DLP Patterns
const SENSITIVE_PATTERNS = [
    { regex: /\b\d{3}-\d{2}-\d{4}\b/, label: 'SSN Detected' },
    { regex: /\b(suicide|kill|hurt|danger)\b/i, label: 'Safety Risk Term' },
    { regex: /\b(diagnosis|meds|medication|rx|treatment)\b/i, label: 'Clinical Term' },
    { regex: /\b(client|patient)\b/i, label: 'PHI Indicator' }
];

export function TeamChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [dlpWarning, setDlpWarning] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'other', name: 'Sarah Jenkins', content: 'Has anyone reviewed the intake for John Doe?', timestamp: '9:41 AM' },
        { id: '2', sender: 'me', name: 'You', content: 'On it. Just finishing up the barrier assessment.', timestamp: '9:42 AM' },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // DLP Scanning
    useEffect(() => {
        const checkDLP = () => {
            for (const pattern of SENSITIVE_PATTERNS) {
                if (pattern.regex.test(message)) {
                    setDlpWarning(pattern.label);
                    return;
                }
            }
            setDlpWarning(null);
        };
        checkDLP();
    }, [message]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: 'me',
            name: 'You',
            content: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setMessage('');
        setDlpWarning(null);
    };

    const handleSaveToCaseNote = (msgId: string) => {
        // Mock backend promotion
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, isSaved: true, content: 'Saved to Case Note #1024' } : m
        ));
        // In real app, this would open a modal to select the client
        alert("Mock: Content promoted to permanent Case Note record.");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[380px] h-[600px] shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            {/* Ephemeral Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        Team Stream
                                    </h4>
                                    <p className="text-[10px] text-orange-600 flex items-center gap-1 font-medium bg-orange-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                        <Clock className="w-3 h-3" /> Ephemeral: Clears in 24h
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 p-4 bg-slate-50/30 dark:bg-slate-950/30 overflow-y-auto scrollbar-thin">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex flex-col gap-1", msg.sender === 'me' ? 'items-end' : 'items-start')}>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group",
                                                msg.sender === 'me'
                                                    ? "bg-indigo-600 text-white rounded-br-none"
                                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-none"
                                            )}>
                                                {msg.isSaved ? (
                                                    <div className="flex items-center gap-2 italic opacity-80">
                                                        <FileText className="w-3 h-3" /> {msg.content}
                                                    </div>
                                                ) : (
                                                    <p>{msg.content}</p>
                                                )}

                                                {/* Promote to Case Note Button (Only appearing on hover for non-me messages or all messages depending on policy) */}
                                                {!msg.isSaved && (
                                                    <button
                                                        onClick={() => handleSaveToCaseNote(msg.id)}
                                                        className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-indigo-600"
                                                        title="Promote to Case Note"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DLP Warning */}
                            <AnimatePresence>
                                {dlpWarning && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-orange-50 dark:bg-orange-950/20 px-4 py-2 border-t border-orange-100 dark:border-orange-900/50"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                                            <ShieldAlert className="w-3 h-3" />
                                            Warning: {dlpWarning} Detected
                                        </div>
                                        <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-0.5">
                                            Do not post Clinical Data in casual chat. Save as a Case Note instead.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input */}
                            <div className={cn("p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300", dlpWarning && "bg-orange-50/50")}>
                                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent text-sm border-0 focus:ring-0 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!message.trim()}
                                        className={cn("h-8 w-8 shrink-0 transition-all", dlpWarning ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700")}
                                    >
                                        <Send className="w-4 h-4 text-white" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-transform hover:scale-105"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </Button>
        </div>
    );
}
