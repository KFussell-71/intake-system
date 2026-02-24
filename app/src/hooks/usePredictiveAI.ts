import { useState, useCallback, useEffect } from 'react';

interface AISuggestion {
    text: string;
    type: 'suggestion' | 'validation' | 'improvement';
}

export function usePredictiveAI(context: string) {
    const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = useCallback(async (currentValue: string) => {
        if (!currentValue || currentValue.length < 10) {
            setSuggestion(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Context: ${context}\nCurrent Input: ${currentValue}\n\nTask: Provide a brief "Predictive AI" suggestion or completion. If the input is good, suggest a logical next step or refinement. If it lacks clinical detail, suggest what to add. Keep it under 20 words.`,
                }),
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            if (data.success && data.text) {
                setSuggestion({
                    text: data.text.trim(),
                    type: 'suggestion'
                });
            }
        } catch (err: any) {
            console.error('AI Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [context]);

    return { suggestion, isLoading, error, getSuggestion };
}
