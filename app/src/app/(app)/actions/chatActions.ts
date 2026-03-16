'use server';

import { revalidatePath } from 'next/cache';
import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';
import { auditService } from '@/services/auditService';

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
        id: string;
        username: string;
    }[];
    last_message?: {
        content: string;
        sender_id: string;
        created_at: string;
    } | null;
};

/**
 * Send a message in a conversation.
 * MIGRATED WITH AUDITING
 */
export async function sendMessage(conversationId: string, content: string, senderId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    // Security check: ensure sender is the authenticated user or user is admin
    if (senderId !== auth.userId && auth.role !== 'admin') {
        return { success: false, message: 'Forbidden' };
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const isParticipant = await tx.conversationParticipant.findUnique({
                where: {
                    conversationId_userId: {
                        conversationId,
                        userId: auth.userId!
                    }
                }
            });

            if (!isParticipant && auth.role !== 'admin') {
                throw new Error('Forbidden: Not a participant');
            }

            const message = await tx.message.create({
                data: {
                    conversationId,
                    senderId: auth.userId!,
                    content
                }
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }
            });

            // Audit Send Action
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'message',
                entityId: message.id,
                details: { conversationId }
            });

            return message;
        });

        revalidatePath('/portal/messages');
        revalidatePath('/dashboard/messages');

        return {
            success: true,
            data: {
                id: result.id,
                conversation_id: result.conversationId,
                sender_id: result.senderId,
                content: result.content,
                created_at: result.createdAt.toISOString()
            }
        };
    } catch (error: any) {
        console.error('Send Message Error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get all conversations for the session user.
 */
export async function getConversations() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: auth.userId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        });

        const formattedConversations: Conversation[] = conversations.map(conv => ({
            id: conv.id,
            last_message_at: conv.lastMessageAt.toISOString(),
            participants: conv.participants.map(p => ({
                id: p.user.id,
                username: p.user.username
            })),
            last_message: conv.messages[0] ? {
                content: conv.messages[0].content,
                sender_id: conv.messages[0].senderId,
                created_at: conv.messages[0].createdAt.toISOString()
            } : null
        }));

        return { success: true, data: formattedConversations };
    } catch (error: any) {
        console.error('Get Conversations Error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get messages.
 */
export async function getMessages(conversationId: string, limit = 50) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const isParticipant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: auth.userId
                }
            }
        });

        if (!isParticipant && auth.role !== 'admin') {
            return { success: false, message: 'Forbidden' };
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return {
            success: true,
            data: messages.reverse().map(m => ({
                id: m.id,
                conversation_id: m.conversationId,
                sender_id: m.senderId,
                content: m.content,
                created_at: m.createdAt.toISOString()
            }))
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Mark as read.
 */
export async function markAsRead(messageIds: string[]) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        if (messageIds.length === 0) return { success: true };

        const data = messageIds.map(id => ({
            messageId: id,
            userId: auth.userId!
        }));

        await prisma.messageReadStatus.createMany({
            data,
            skipDuplicates: true
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Direct conversation between two users.
 */
export async function getOrCreateConversation(userId2: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    const userId1 = auth.userId;

    try {
        const existingParticipation = await prisma.conversationParticipant.findMany({
            where: { userId: userId1 },
            select: { conversationId: true }
        });

        const conversationIds = existingParticipation.map(p => p.conversationId);

        const commonConversation = await prisma.conversation.findFirst({
            where: {
                id: { in: conversationIds },
                participants: {
                    every: {
                        userId: { in: [userId1!, userId2] }
                    },
                    some: {
                        userId: userId2
                    }
                }
            }
        });

        if (commonConversation) {
            return { success: true, id: commonConversation.id };
        }

        const newConv = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const conv = await tx.conversation.create({ data: {} });
            await tx.conversationParticipant.createMany({
                data: [
                    { conversationId: conv.id, userId: userId1! },
                    { conversationId: conv.id, userId: userId2 }
                ]
            });
            return conv;
        });

        return { success: true, id: newConv.id };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
