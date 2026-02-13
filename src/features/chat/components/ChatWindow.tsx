'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '../hooks/useChat';
import { sendMessage, getMessages, Message } from '@/app/actions/chatActions';
import { format } from 'date-fns';

interface ChatWindowProps {
    conversationId: string;
    currentUserId: string;
    otherUserName: string;
}

export function ChatWindow({ conversationId, currentUserId, otherUserName }: ChatWindowProps) {
    const { messages, setMessages, typingUsers, sendTyping } = useChat(conversationId, currentUserId);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load
    useEffect(() => {
        if (conversationId) {
            loadMessages();
        }
    }, [conversationId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typingUsers]);

    async function loadMessages() {
        setLoading(true);
        const res = await getMessages(conversationId);
        if (res.success && res.data) {
            setMessages(res.data);
        }
        setLoading(false);
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;

        const content = input;
        setInput('');

        // Optimistic UI could go here, but we wait for Realtime echo or server response
        // for simplicity, let's just fire sending. 
        // Actually, Realtime will echo it back via Postgres Changes. 
        // But duplications might happen if we add it manually AND listen.
        // Strategy: Add manually for speed, dedupe if needed, OR just wait for server ack. 
        // Let's manually add to list for instant feedback, assuming hook handles dupes (it doesn't yet).
        // Safest: Wait for server action to return, then add.

        const res = await sendMessage(conversationId, content, currentUserId);
        if (res.success) {
            // If the socket is fast, it might have already arrived. 
            // We can check if ID exists.
            setMessages(prev => {
                if (prev.find(m => m.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);

        // Typing logic
        sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {otherUserName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{otherUserName}</h3>
                        <p className="text-xs text-slate-500">
                            {typingUsers.length > 0 ? 'Typing...' : 'Online'}
                        </p>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {loading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                            )}>
                                <p>{msg.content}</p>
                                <div className={cn("text-[10px] mt-1 flex items-center justify-end gap-1", isMe ? "text-blue-100" : "text-slate-400")}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                    {isMe && <CheckCheck className="w-3 h-3" />}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-slate-200 rounded-full px-4 py-2 flex gap-1 items-center">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInput}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
