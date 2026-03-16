'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Wand2 } from 'lucide-react';
import { aiService } from '@/lib/ai/UnifiedAIService';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [accumulatedTranscript, setAccumulatedTranscript] = useState('');

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
                    let interimTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    if (finalTranscript) {
                        setAccumulatedTranscript(prev => prev + finalTranscript);
                        onTranscript(accumulatedTranscript + finalTranscript + interimTranscript);
                    }
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognitionInstance.onend = async () => {
                    setIsListening(false);
                    // Automatically trigger clean up on end if we have content
                    if (accumulatedTranscript.length > 20) {
                        handleAIClean(accumulatedTranscript);
                    }
                };

                setRecognition(recognitionInstance);
            }
        }
    }, [onTranscript]);

    const handleAIClean = async (text: string) => {
        if (!text.trim()) return;
        setIsProcessing(true);
        try {
            const prompt = `
You are a clinical transcription assistant.
Correct the punctuation and grammar of the following dictated text while preserving clinical terminology.
Do not change the meaning. Only add punctuation and fix minor speech recognition errors.

TEXT: ${text}

Return only the corrected text.
`;
            const cleaned = await aiService.ask({ prompt, temperature: 0.3 });
            onTranscript(cleaned.trim());
        } catch (error) {
            console.error('AI Clean failed', error);
            onTranscript(text); // Fallback to raw
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = useCallback(() => {
        if (!process.browser && !recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setAccumulatedTranscript('');
            recognition.start();
            setIsListening(true);
        }
    }, [isListening, recognition]);

    const handleStopAndClean = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
            // We need a way to capture the final results or the state must have them
            // For this UI, we assume 'onTranscript' was called with fragments.
            // If we want a "FINAL" clean, we should accumulate.
        }
    }, [recognition]);

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
            disabled={isProcessing}
        >
            {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isListening ? (
                <MicOff className="w-4 h-4" />
            ) : (
                <Mic className="w-4 h-4" />
            )}
        </button>
    );
};
