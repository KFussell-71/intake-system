import { redirect } from 'next/navigation';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { getOrCreateConversation } from '@/app/(app)/actions/chatActions'; // This needs to be imported from actions
import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';

export default async function PortalMessagesPage() {
    const auth = await verifyAuthentication();

    if (!auth.authenticated || !auth.userId) {
        redirect('/login');
    }

    // Get Portal Access and Client data
    const portalAccess = await prisma.portalAccess.findUnique({
        where: { id: auth.userId },
        include: {
            client: {
                select: {
                    id: true,
                    email: true,
                    assignedToId: true
                }
            }
        }
    });

    if (!portalAccess || !portalAccess.client) {
        redirect('/login');
    }

    const { client } = portalAccess;
    const targetUserId = client.assignedToId;

    let targetName = 'Case Manager';
    if (targetUserId) {
        const profile = await prisma.profile.findUnique({
            where: { id: targetUserId },
            select: { fullName: true, username: true }
        });
        if (profile) {
            targetName = profile.fullName || profile.username;
        }
    }


    if (!targetUserId) {
        return (
            <div className="p-8 text-center text-white bg-slate-900 min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>
                <p>You are not currently assigned to a Case Manager. Please contact support.</p>
            </div>
        );
    }

    // Get or Create Conversation
    const conv = await getOrCreateConversation(targetUserId);

    if (!conv.success || !conv.id) {
        return (
            <div className="p-8 text-center text-red-500 bg-slate-900 min-h-screen">
                <p>Error initializing chat: {conv.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-white text-brand-900">Message Center</h1>
            <div className="h-[600px] bg-slate-800/50 rounded-xl border border-white/10">
                <ChatWindow
                    conversationId={conv.id}
                    currentUserId={portalAccess.id}
                    otherUserName={targetName}
                />
            </div>
        </div>
    );
}

