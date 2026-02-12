'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Clock, AlertCircle } from 'lucide-react';
import { CommunicationLog } from '@/services/CommunicationService';

interface Props {
    clientId: string;
    initialMessages?: CommunicationLog[];
    onSendMessage: (content: string) => Promise<boolean>;
}

export const MessageCenter: React.FC<Props> = ({ clientId, initialMessages = [], onSendMessage }) => {
    const [messages, setMessages] = useState<CommunicationLog[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        setIsSending(true);
        try {
            const success = await onSendMessage(inputValue);
            if (success) {
                // Optimistically update or wait for revalidation
                // For now, we'll assume the parent handles revalidation or we'd add a temporary message
                setInputValue('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Caseworker Support</h3>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                            <Bot className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400">No messages yet. Send a message to start a conversation with your caseworker.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isOutbound = msg.direction === 'outbound';
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isOutbound ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`
                                    max-w-[80%] p-3 rounded-2xl text-sm shadow-sm
                                    ${isOutbound
                                        ? 'bg-slate-800 border border-white/5 text-slate-200 rounded-bl-none'
                                        : 'bg-primary text-white rounded-br-none shadow-primary/20'}
                                `}>
                                    <p>{msg.content}</p>
                                    <div className={`mt-1 flex items-center gap-1 text-[9px] ${isOutbound ? 'text-slate-500' : 'text-white/60'}`}>
                                        <Clock className="w-3 h-3" />
                                        {new Date(msg.sent_at || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/5">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        disabled={isSending}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {isSending ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Messages are monitored for quality and safety.
                </p>
            </div>
        </div>
    );
};
