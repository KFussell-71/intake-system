'use client';

import React, { useEffect, useState } from 'react';
import { getConversations, Conversation } from '@/app/actions/chatActions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, User } from 'lucide-react';

interface ConversationListProps {
    userId: string;
    onSelect: (conversationId: string, name: string) => void;
    selectedId?: string;
}

export function ConversationList({ userId, onSelect, selectedId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getConversations(userId);
            if (res.success && res.data) {
                setConversations(res.data);
            }
            setLoading(false);
        }
        load();
    }, [userId]);

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (conversations.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No conversations yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-r">
            <div className="p-4 border-b font-semibold text-slate-700">Messages</div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map(conv => {
                    // Find other participant
                    const other = conv.participants.find(p => p.user_id !== userId) || conv.participants[0];
                    const name = other?.username || 'Unknown Users';

                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id, name)}
                            className={cn(
                                "w-full text-left p-4 border-b hover:bg-slate-50 transition-colors flex gap-3",
                                selectedId === conv.id && "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-600"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-medium text-slate-900 truncate">{name}</h4>
                                    {conv.last_message_at && (
                                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 truncate">
                                    {conv.last_message?.content || <span className="italic opacity-50">No messages yet</span>}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
