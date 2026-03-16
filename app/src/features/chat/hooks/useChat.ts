'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMessages, markAsRead, Message } from '@/app/(app)/actions/chatActions';

/**
 * useChat Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Polling.
 * This ensures compliance with the Prisma/NextAuth unified security model and 
 * eliminates direct Supabase dependencies from within the component tree.
 */
export function useChat(conversationId: string, userId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    // Typing indicators are disabled in the browser-side polling model for performance
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const fetchMessages = useCallback(async (isInitial = false) => {
        if (!conversationId) return;

        try {
            const result = await getMessages(conversationId);
            if (result.success && result.data) {
                const newMessages = result.data as Message[];
                
                // Detect new messages from others to mark as read
                if (!isInitial && newMessages.length > messages.length) {
                    const latest = newMessages[newMessages.length - 1];
                    if (latest.sender_id !== userId) {
                        markAsRead([latest.id]);
                    }
                }

                setMessages(newMessages);
            }
        } catch (err) {
            console.error('Failed to sync chat messages:', err);
        }
    }, [conversationId, userId, messages.length]);

    useEffect(() => {
        if (!conversationId) return;

        fetchMessages(true);

        // POLL FALLBACK: Every 5 seconds for active chat sync
        // This replaces the direct postgres_changes subscription
        const interval = setInterval(() => {
            fetchMessages(false);
        }, 5000);

        return () => clearInterval(interval);
    }, [conversationId, fetchMessages]);

    const sendTyping = (isTyping: boolean) => {
        // Typing broadcast is currently unsupported in the Supabase-free polling model
        // Conceptually could be implemented via a 'typing_status' table if required
    };

    return {
        messages,
        setMessages,
        typingUsers,
        sendTyping
    };
}
