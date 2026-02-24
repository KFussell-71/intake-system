'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setIsSupported(true);
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = true;
                recognitionInstance.interimResults = true;
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        }
                    }
                    if (finalTranscript) {
                        onTranscript(finalTranscript);
                    }
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognitionInstance.onend = () => {
                    // Auto-restart if we think we should still be listening, 
                    // providing a "continuous" feel, unless stopped manually.
                    // For now, we'll just stop to be safe and simple.
                    setIsListening(false);
                };

                setRecognition(recognitionInstance);
            }
        }
    }, [onTranscript]);

    const toggleListening = useCallback(() => {
        if (!process.browser && !recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    }, [isListening, recognition]);

    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`
                p-2 rounded-full transition-all duration-200
                ${isListening
                    ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}
                ${className}
            `}
            title={isListening ? 'Stop Dictation' : 'Start Dictation'}
        >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
    );
};
