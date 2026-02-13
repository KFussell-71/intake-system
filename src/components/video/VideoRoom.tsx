'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoRoomProps {
    roomName: string;
    displayName: string;
    onLeave?: () => void;
}

export default function VideoRoom({ roomName, displayName, onLeave }: VideoRoomProps) {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<any>(null);

    useEffect(() => {
        // Load Jitsi script dynamically
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => initJitsi();
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            if (api) {
                api.dispose();
            }
        };
    }, []);

    const initJitsi = () => {
        if (!jitsiContainerRef.current) return;
        setLoading(false);

        // @ts-ignore - JitsiMeetExternalAPI is loaded from script
        const newApi = new window.JitsiMeetExternalAPI('meet.jit.si', {
            roomName: `new-beginning-intake-${roomName}`,
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: displayName
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: false // Skip prejoin for smoother UX in-app
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            }
        });

        newApi.addEventListeners({
            videoConferenceLeft: () => {
                if (onLeave) onLeave();
                else window.close();
            },
        });

        setApi(newApi);
    };

    return (
        <div className="w-full h-full relative bg-slate-900 rounded-xl overflow-hidden">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mr-2" />
                    Initializing Secure Room...
                </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>
    );
}
