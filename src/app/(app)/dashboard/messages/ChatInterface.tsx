'use client';

import React, { useState } from 'react';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { ChatWindow } from '@/features/chat/components/ChatWindow';

export function ChatInterface({ userId }: { userId: string }) {
    const [selectedConv, setSelectedConv] = useState<{ id: string; name: string } | null>(null);

    return (
        <div className="flex h-[600px] border rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="w-1/3 min-w-[300px]">
                <ConversationList
                    userId={userId}
                    onSelect={(id, name) => setSelectedConv({ id, name })}
                    selectedId={selectedConv?.id}
                />
            </div>
            <div className="flex-1 bg-slate-50 border-l">
                {selectedConv ? (
                    <div className="h-full p-4">
                        <ChatWindow
                            conversationId={selectedConv.id}
                            currentUserId={userId}
                            otherUserName={selectedConv.name}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
