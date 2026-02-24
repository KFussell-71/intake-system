import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, getRateLimitKey } from '@/lib/rate-limit';

/**
 * SECURITY: Next.js Middleware for Server-Side Route Protection & Rate Limiting
 * 
 * This middleware runs on the Edge and provides:
 * 1. Authentication verification before page load
 * 2. Role-based route protection for sensitive areas
 * 3. Rate limiting for abuse prevention
 * 4. Portal-specific authentication flow
 * 
 * NOTE: This is a first line of defense. Components should still verify auth.
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

// Portal routes (require portal user auth, not staff auth)
const PORTAL_ROUTES = [
    '/portal',
];

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

        // Add rate limit headers to response
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
    const supabaseAuthToken = request.cookies.get('sb-access-token') ||
        request.cookies.get('sb-refresh-token') ||
        Array.from(request.cookies.getAll()).find(c => c.name.includes('-auth-token'));

    // Check if route requires authentication
    const requiresAuth = PROTECTED_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    const requiresSupervisor = SUPERVISOR_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (requiresAuth || requiresSupervisor) {
        if (!supabaseAuthToken) {
            // SECURITY: Redirect unauthenticated users to login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        if (requiresSupervisor) {
            // Add a header that components can check
            const response = NextResponse.next();
            response.headers.set('x-requires-supervisor', 'true');
            return response;
        }
    }

    return NextResponse.next();
}

/**
 * Handle portal-specific routes
 */
async function handlePortalRoutes(request: NextRequest, pathname: string): Promise<NextResponse> {
    // Portal login page is always accessible
    if (pathname === '/portal/login') {
        return NextResponse.next();
    }

    // Check for portal user auth token
    const supabaseAuthToken = request.cookies.get('sb-access-token') ||
        request.cookies.get('sb-refresh-token') ||
        Array.from(request.cookies.getAll()).find(c => c.name.includes('-auth-token'));

    // If no auth token, redirect to portal login
    if (!supabaseAuthToken) {
        return NextResponse.redirect(new URL('/portal/login', request.url));
    }

    // Auth token exists - allow access
    // Further validation (client_users check) happens in the page component
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
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)',
    ],
};
