import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { getOrCreateConversation } from '@/app/actions/chatActions'; // This needs to be imported from actions

export default async function PortalMessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get Assigned Staff
    const { data: clientData } = await supabase
        .from('clients')
        .select('assigned_to')
        .eq('email', user.email)
        .single();

    // In strict mode we'd use profiles link. 
    // Let's retry with mapped ID if clients table uses auth.id
    // But schema says clients.id is UUID pk, created_by referenced.
    // Let's assume there's a link. If not, we might need to find by created_by = user.id (unlikely for client)

    // For now, let's just find ANY staff to talk to if not assigned, or fail gracefully.
    // Or better: Use the "Concierge" as the default chat partner (Admin).

    const targetUserId = clientData?.assigned_to;
    // We need targetName. Since we can't join easily in single query without views/foreign keys perfectly aligned on email, lets fetch profile
    let targetName = 'Case Manager';
    if (targetUserId) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', targetUserId).single();
        if (profile) targetName = profile.username;
    }


    if (!targetUserId) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>
                <p>You are not currently assigned to a Case Manager. Please contact support.</p>
            </div>
        );
    }

    // Get or Create Conversation
    // In Server Component, we can await this.
    const conv = await getOrCreateConversation(user.id, targetUserId);

    if (!conv.success || !conv.id) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Error initializing chat: {conv.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-brand-900">Message Center</h1>
            <div className="h-[600px]">
                <ChatWindow
                    conversationId={conv.id}
                    currentUserId={user.id}
                    otherUserName={targetName}
                />
            </div>
        </div>
    );
}
