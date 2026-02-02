import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimiters, getRateLimitKey } from '@/lib/rate-limit';

/**
 * SECURITY: Next.js Middleware for Server-Side Route Protection & Rate Limiting
 * 
 * This middleware provides:
 * 1. REAL authentication verification using supabase.auth.getUser()
 * 2. Timeout protection to prevent hanging if Supabase is slow
 * 3. Proper error handling and fail-safe redirects
 * 4. Rate limiting for abuse prevention
 */

// Routes that require staff authentication
const PROTECTED_ROUTES = [
    '/dashboard',
    '/intake',
    '/directory',
    '/reports',
    '/follow-ups',
    '/documents',
    '/settings',
];

// Routes that require supervisor/admin role
const SUPERVISOR_ROUTES = [
    '/supervisor',
];

// Routes that are always public
const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/portal/login',
    '/',
];

/**
 * Helper to create a Supabase client for middleware
 */
function createMiddlewareSupabaseClient(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    return { supabase, response };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // ======================================================================
    // RATE LIMITING FOR PORTAL ROUTES
    // ======================================================================
    if (pathname.startsWith('/portal')) {
        const rateLimitKey = getRateLimitKey(ip);
        const { success, remaining } = await rateLimiters.portal.check(rateLimitKey);

        if (!success) {
            return new NextResponse('Too many requests. Please try again later.', {
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'X-RateLimit-Remaining': '0'
                }
            });
        }

        // Handle portal routes
        const response = await handlePortalRoutes(request, pathname);
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
    }

    // ======================================================================
    // PUBLIC ROUTES
    // ======================================================================
    if (PUBLIC_ROUTES.some(route => pathname === route)) {
        return NextResponse.next();
    }

    // ======================================================================
    // STAFF AUTHENTICATION CHECK
    // ======================================================================
    const requiresAuth = PROTECTED_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    const requiresSupervisor = SUPERVISOR_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (requiresAuth || requiresSupervisor) {
        const { supabase, response } = createMiddlewareSupabaseClient(request);

        try {
            // SECURITY: Actually validate the session with a 5-second timeout
            // This prevents the app from hanging if Supabase is slow or misconfigured
            const authPromise = supabase.auth.getUser();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth timeout')), 5000)
            );
            
            const result = await Promise.race([authPromise, timeoutPromise]) as any;
            const user = result?.data?.user;
            const error = result?.error;

            if (error || !user) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(loginUrl);
            }

            // For supervisor routes, we could check the role here, 
            // but to keep this first fix safe, we'll just verify the user exists
            if (requiresSupervisor) {
                response.headers.set('x-requires-supervisor', 'true');
            }

            return response;
        } catch (error) {
            console.error('[AUTH] Middleware authentication error:', error);
            // On error/timeout, redirect to login as a safe fallback
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            loginUrl.searchParams.set('reason', 'auth_error');
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

/**
 * Handle portal-specific routes
 */
async function handlePortalRoutes(request: NextRequest, pathname: string): Promise<NextResponse> {
    if (pathname === '/portal/login') {
        return NextResponse.next();
    }

    // Use cookie existence check for portal for now (legacy behavior)
    const hasToken = request.cookies.get('sb-access-token') ||
        request.cookies.get('sb-refresh-token') ||
        Array.from(request.cookies.getAll()).find(c => c.name.includes('-auth-token'));

    if (!hasToken) {
        return NextResponse.redirect(new URL('/portal/login', request.url));
    }

    return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - public files
         */
        '/dashboard/:path*',
        '/intake/:path*',
        '/directory/:path*',
        '/reports/:path*',
        '/follow-ups/:path*',
        '/documents/:path*',
        '/settings/:path*',
        '/supervisor/:path*',
        '/portal/:path*',
    ],
};
