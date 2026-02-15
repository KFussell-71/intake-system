'use client';

import { useEffect, useState, useRef } from 'react';
import { CommunicationLog, communicationService } from '@/services/CommunicationService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Send, Wand2, Mail, MessageSquare, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

interface Props {
    caseId: string;
    clientId?: string;
    recipientContact?: string;
}

export function MessageCenter({ caseId, clientId, recipientContact }: Props) {
    const [messages, setMessages] = useState<CommunicationLog[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState<'email' | 'sms' | 'internal'>('internal');
    const [isSending, setIsSending] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();

        // Subscription for real-time updates could go here
    }, [caseId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await communicationService.getCaseCommunications(caseId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setIsSending(true);
        try {
            const sent = await communicationService.sendMessage({
                case_id: caseId,
                client_id: clientId,
                type: messageType,
                content: newMessage,
                recipient_contact: recipientContact
            });

            setMessages([...messages, sent]);
            setNewMessage('');
            toast.success('Message sent');
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleMagicPolish = async () => {
        if (!newMessage.trim()) return;
        setIsPolishing(true);
        // Simulate AI Polish
        setTimeout(() => {
            setNewMessage((prev) => `Dear Client,\n\n${prev}\n\nBest regards,\nCase Management Team`);
            setIsPolishing(false);
            toast.success('Message polished!');
        }, 800);
    };

    return (
        <GlassCard className="h-[600px] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Communication Center</h3>
                    <p className="text-xs text-slate-500">Secure messaging with end-to-end logging</p>
                </div>
                <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setMessageType('internal')}
                        className={`p-2 rounded-md ${messageType === 'internal' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Internal Note"
                    >
                        <Lock className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMessageType('sms')}
                        className={`p-2 rounded-md ${messageType === 'sms' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                        title="SMS"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMessageType('email')}
                        className={`p-2 rounded-md ${messageType === 'email' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                        title="Email"
                    >
                        <Mail className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/10">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-20">
                        No messages yet. Start the conversation!
                    </div>
                )}

                {messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const isInternal = msg.type === 'internal';

                    return (
                        <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                                <div className={`
                                    p-3 rounded-2xl shadow-sm border
                                    ${isInternal
                                        ? 'bg-amber-50 border-amber-100 text-amber-900 rounded-br-none'
                                        : isOutbound
                                            ? 'bg-blue-600 border-blue-600 text-white rounded-br-none'
                                            : 'bg-white border-slate-200 text-slate-800 rounded-bl-none'
                                    }
                                `}>
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    {isInternal && <Lock className="w-3 h-3 text-slate-400" />}
                                    <span className="text-[10px] text-slate-400">
                                        {format(new Date(msg.created_at), 'h:mm a')}
                                    </span>
                                    {isOutbound && !isInternal && (
                                        msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-slate-300" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Composer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Type a ${messageType} message...`}
                        className="min-h-[80px] pr-24 resize-none bg-slate-50 dark:bg-slate-800/50 border-0 focus-visible:ring-1"
                    />
                    <div className="absolute right-2 bottom-2 flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Magic Polish"
                            onClick={handleMagicPolish}
                            disabled={isPolishing}
                        >
                            <Wand2 className={`w-4 h-4 ${isPolishing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            size="icon"
                            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                            onClick={handleSend}
                            disabled={isSending || !newMessage.trim()}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-xs text-slate-400 mt-2 px-1 flex justify-between">
                    <span>Sending as: <strong>Case Manager</strong></span>
                    <span className="uppercase">{messageType}</span>
                </div>
            </div>
        </GlassCard>
    );
}
