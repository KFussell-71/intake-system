'use client';

import { useParams, useRouter } from 'next/navigation';
import VideoRoom from '@/components/video/VideoRoom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MeetPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;

    // In a real app, verify user session here and get their real name
    // For demo/MVP, we'll use a generic name or pull from local storage/context if available
    const displayName = "Case Worker / Client";

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950">
            <header className="p-4 flex items-center gap-4 bg-slate-900 border-b border-slate-800">
                <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Secure Video Session
                    </h1>
                    <p className="text-xs text-slate-400">Room: {roomId}</p>
                </div>
            </header>

            <main className="flex-1 p-4">
                <VideoRoom
                    roomName={roomId}
                    displayName={displayName}
                    onLeave={() => router.back()}
                />
            </main>
        </div>
    );
}
