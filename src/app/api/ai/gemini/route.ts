import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * SECURE AI PROXY ROUTE
 * 
 * This route handles Gemini AI requests on the server side.
 * It prevents the GEMINI_API_KEY from being exposed to the client.
 */

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication (Only logged-in staff can use AI)
        const response = NextResponse.next();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({ name, value: '', ...options });
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized: Please log in to use AI features.' },
                { status: 401 }
            );
        }

        // 2. Validate API Key existence
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[AI PROXY] GEMINI_API_KEY is not configured in environment variables.');
            return NextResponse.json(
                { error: 'AI Service is currently unavailable. Please contact an administrator.' },
                { status: 503 }
            );
        }

        // 3. Parse request body
        const body = await request.json();
        const { prompt, model = 'gemini-pro' } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // 4. Call Google Gemini API (Server-to-Server)
        // We use the standard fetch API to keep it lightweight
        const googleResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!googleResponse.ok) {
            const errorData = await googleResponse.json();
            console.error('[AI PROXY] Google API Error:', errorData);
            return NextResponse.json(
                { error: 'Failed to communicate with AI service' },
                { status: googleResponse.status }
            );
        }

        const data = await googleResponse.json();
        
        // 5. Return the AI response to our frontend
        return NextResponse.json(data);

    } catch (error) {
        console.error('[AI PROXY] Internal Server Error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
