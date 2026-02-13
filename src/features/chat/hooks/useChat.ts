'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client'; // Assuming client-side instance
import { Message, markAsRead } from '@/app/actions/chatActions';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChat(conversationId: string, userId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!conversationId) return;

        // Initialize Channel
        const channel = supabase.channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => [...prev, newMsg]);

                    // If message is not from me, mark as read immediately (if window focused)
                    // Simplified: just mark as read
                    if (newMsg.sender_id !== userId) {
                        markAsRead([newMsg.id], userId);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    if (payload.payload.userId !== userId) {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            if (payload.payload.isTyping) newSet.add(payload.payload.userId);
                            else newSet.delete(payload.payload.userId);
                            return newSet;
                        });
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId]);

    const sendTyping = (isTyping: boolean) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping }
        });
    };

    return {
        messages,
        setMessages, // To hydrate initial state
        typingUsers: Array.from(typingUsers),
        sendTyping
    };
}
