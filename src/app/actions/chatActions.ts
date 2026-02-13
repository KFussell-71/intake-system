'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type Message = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

export type Conversation = {
    id: string;
    last_message_at: string;
    participants: {
        user_id: string;
        username?: string; // Joined from profiles
    }[];
    last_message?: {
        content: string;
        sender_id: string;
        created_at: string;
    } | null;
};

export async function sendMessage(conversationId: string, content: string, senderId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content
            })
            .select()
            .single();

        if (error) throw error;

        // No need to revalidatePath if using Realtime on client, 
        // but good for server components
        revalidatePath('/portal/messages');
        revalidatePath('/dashboard/messages');

        return { success: true, data };
    } catch (error: any) {
        console.error('Send Message Error:', error);
        return { success: false, message: error.message };
    }
}

export async function getConversations(userId: string) {
    try {
        const supabase = await createClient();
        // 1. Get Conversation IDs for user
        const { data: participation } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (!participation || participation.length === 0) return { success: true, data: [] };

        const conversationIds = participation.map(p => p.conversation_id);

        // 2. Get Conversations details
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        // 3. Hydrate with participants and last message (Manual join since Supabase JS join syntax can be verbose/tricky for M2M)
        // Optimization: Could use a View or RPC for this. Doing client-side join logic for now.

        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            // Get Participants
            const { data: participants } = await supabase
                .from('conversation_participants')
                .select('user_id') // Join profiles ideally
                .eq('conversation_id', conv.id);

            // Get Last Message
            const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, sender_id, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get Profiles for participants
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', (participants || []).map(p => p.user_id));


            return {
                ...conv,
                participants: profiles || [],
                last_message: lastMsg || null
            };
        }));

        return { success: true, data: enrichedConversations };
    } catch (error: any) {
        console.error('Get Conversations Error:', error);
        return { success: false, message: error.message };
    }
}

export async function getMessages(conversationId: string, limit = 50) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true }) // Oldest first for chat window? Or descending and reverse?
            // Usually fetch DESC limit 50, then reverse for display
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { success: true, data: (data || []).reverse() };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function markAsRead(messageIds: string[], userId: string) {
    try {
        if (messageIds.length === 0) return { success: true };

        const toInsert = messageIds.map(id => ({
            message_id: id,
            user_id: userId
        }));

        const supabase = await createClient();
        const { error } = await supabase
            .from('message_read_status')
            .upsert(toInsert, { onConflict: 'message_id, user_id' });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
    // Check if conversation exists between these two
    // Logic: Find common conversation_id in participants
    // This is expensive in pure API, better via RPC. 
    // Implementation:
    // 1. Get convs for U1
    // 2. Get convs for U2
    // 3. Find intersection where count(participants) == 2 (if direct chat)

    // For MVP/Demo: Just create new if strict logic is too complex for client-side join
    // But let's try a direct query if possible or RPC.

    // Simplest: 
    const supabase = await createClient();
    const { data: convs1 } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId1);
    const { data: convs2 } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId2);

    const ids1 = new Set((convs1 || []).map(c => c.conversation_id));
    const common = (convs2 || []).find(c => ids1.has(c.conversation_id));

    if (common) {
        return { success: true, id: common.conversation_id };
    }

    // Create new
    const { data: newConv, error: convError } = await supabase.from('conversations').insert({}).select().single();
    if (convError) return { success: false, message: convError.message };

    // Add participants
    await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: userId1 },
        { conversation_id: newConv.id, user_id: userId2 }
    ]);

    return { success: true, id: newConv.id };
}
