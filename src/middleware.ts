/**
 * REFACTORED: Next.js Middleware for Server-Side Route Protection & Rate Limiting
 * 
 * IMPROVEMENTS:
 * 1. Added ACTUAL token validation (not just cookie existence check)
 * 2. Implemented proper role-based access control with database verification
 * 3. Added request ID tracking for distributed tracing
 * 4. Improved rate limiting with proper headers
 * 5. Added security headers (CSP, HSTS, etc.)
 * 6. Better error handling and logging
 * 
 * WHY: Original middleware only checked if auth cookies existed, not if they were valid.
 * An attacker could set a fake cookie and bypass authentication entirely.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimiters, getRateLimitKey, getRateLimitHeaders } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * Routes that require staff authentication.
 * CHANGED: Made this a Set for O(1) lookup instead of array iteration.
 */
const PROTECTED_ROUTES = new Set([
    '/dashboard',
    '/intake',
    '/directory',
    '/reports',
    '/follow-ups',
    '/documents',
    '/settings',
]);

/**
 * Routes that require supervisor/admin role.
 * CHANGED: Made this a Set for O(1) lookup.
 */
const SUPERVISOR_ROUTES = new Set([
    '/supervisor',
    '/auditor',
    '/compliance',
]);

/**
 * Routes that are always public (no authentication required).
 * CHANGED: Made this a Set for O(1) lookup.
 */
const PUBLIC_ROUTES = new Set([
    '/login',
    '/signup',
    '/portal/login',
    '/',
]);

/**
 * Portal routes (require portal user auth, not staff auth).
 */
const PORTAL_ROUTES_PREFIX = '/portal';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * ADDED: Extract client IP address from request headers.
 * Handles various proxy configurations (Vercel, Cloudflare, etc.).
 * 
 * @param request - Next.js request object
 * @returns Client IP address or 'unknown'
 */
function getClientIp(request: NextRequest): string {
    // Check common proxy headers in order of preference
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first (client IP)
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }

    return 'unknown';
}

/**
 * ADDED: Check if a path matches a protected route.
 * Supports both exact matches and prefix matches (e.g., /dashboard/*)
 * 
 * @param pathname - Request pathname
 * @param routes - Set of protected routes
 * @returns True if the path is protected
 */
function isProtectedPath(pathname: string, routes: Set<string>): boolean {
    // Check exact match
    if (routes.has(pathname)) {
        return true;
    }

    // Check prefix match (e.g., /dashboard/* matches /dashboard/clients)
    // Convert Set to Array for TypeScript compatibility
    for (const route of Array.from(routes)) {
        if (pathname.startsWith(route + '/')) {
            return true;
        }
    }

    return false;
}

/**
 * ADDED: Create a Supabase client for middleware.
 * This client can read/write cookies to maintain session state.
 * 
 * @param request - Next.js request object
 * @returns Supabase client and response object
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

/**
 * ADDED: Add security headers to response.
 * Implements OWASP recommendations for web application security.
 * 
 * @param response - Next.js response object
 * @returns Response with security headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy (prevents XSS attacks)
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; " +
        "frame-ancestors 'none';"
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection (legacy browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy (privacy)
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HSTS (force HTTPS) - only in production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    // Permissions policy (restrict browser features)
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    );

    return response;
}

// ============================================================================
// MAIN MIDDLEWARE FUNCTION
// ============================================================================

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = getClientIp(request);

    // ADDED: Generate request ID for distributed tracing
    const requestId = uuidv4();

    // ========================================================================
    // RATE LIMITING FOR PORTAL ROUTES
    // ========================================================================
    if (pathname.startsWith(PORTAL_ROUTES_PREFIX)) {
        const rateLimitKey = getRateLimitKey(ip);
        const rateLimitResult = await rateLimiters.portal.check(rateLimitKey);

        if (!rateLimitResult.success) {
            // CHANGED: Return proper rate limit response with headers
            return new NextResponse('Too many requests. Please try again later.', {
                status: 429,
                headers: {
                    ...getRateLimitHeaders(rateLimitResult),
                    'X-Request-ID': requestId,
                },
            });
        }

        // Handle portal-specific authentication
        const portalResponse = await handlePortalRoutes(request, pathname, requestId);
        
        // CHANGED: Add rate limit headers to successful responses
        Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
            portalResponse.headers.set(key, value);
        });
        
        return addSecurityHeaders(portalResponse);
    }

    // ========================================================================
    // PUBLIC ROUTES (No Authentication Required)
    // ========================================================================
    if (PUBLIC_ROUTES.has(pathname)) {
        const response = NextResponse.next();
        response.headers.set('X-Request-ID', requestId);
        return addSecurityHeaders(response);
    }

    // ========================================================================
    // STAFF AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    const requiresAuth = isProtectedPath(pathname, PROTECTED_ROUTES);
    const requiresSupervisor = isProtectedPath(pathname, SUPERVISOR_ROUTES);

    if (requiresAuth || requiresSupervisor) {
        // CHANGED: Actually validate the session, not just check for cookie existence
        const { supabase, response } = createMiddlewareSupabaseClient(request);

        try {
            // CHANGED: Verify the session is valid by calling Supabase
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                // SECURITY: Redirect unauthenticated users to login
                console.warn(`[AUTH] Unauthenticated access attempt to ${pathname} from ${ip} (Request ID: ${requestId})`);
                
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('redirect', pathname);
                loginUrl.searchParams.set('reason', 'auth_required');
                
                return NextResponse.redirect(loginUrl);
            }

            // CHANGED: For supervisor routes, verify the user's role in the database
            if (requiresSupervisor) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) {
                    console.error(`[AUTH] Failed to fetch profile for user ${user.id} (Request ID: ${requestId}):`, profileError);
                    
                    return new NextResponse('Access Denied: Unable to verify permissions', {
                        status: 403,
                        headers: { 'X-Request-ID': requestId },
                    });
                }

                // CHANGED: Enforce role-based access control
                if (profile.role !== 'admin' && profile.role !== 'supervisor') {
                    console.warn(`[AUTH] Unauthorized access attempt to ${pathname} by user ${user.id} with role ${profile.role} (Request ID: ${requestId})`);
                    
                    return new NextResponse('Access Denied: Insufficient permissions', {
                        status: 403,
                        headers: { 'X-Request-ID': requestId },
                    });
                }

                // ADDED: Set role header for downstream components
                response.headers.set('x-user-role', profile.role);
            }

            // ADDED: Set user ID header for logging and audit trails
            response.headers.set('x-user-id', user.id);
            response.headers.set('x-request-id', requestId);

            return addSecurityHeaders(response);

        } catch (error) {
            // CHANGED: Added proper error handling for Supabase failures
            console.error(`[AUTH] Middleware error (Request ID: ${requestId}):`, error);
            
            // Fail closed (deny access) on errors for security
            return new NextResponse('Authentication service unavailable', {
                status: 503,
                headers: { 'X-Request-ID': requestId },
            });
        }
    }

    // Default: Allow request to proceed
    const response = NextResponse.next();
    response.headers.set('X-Request-ID', requestId);
    return addSecurityHeaders(response);
}

// ============================================================================
// PORTAL ROUTE HANDLER
// ============================================================================

/**
 * Handle portal-specific routes with proper authentication.
 * 
 * CHANGED: Added actual session validation instead of just cookie check.
 * CHANGED: Verify user exists in client_users table.
 * 
 * @param request - Next.js request object
 * @param pathname - Request pathname
 * @param requestId - Request ID for tracing
 * @returns Next.js response
 */
async function handlePortalRoutes(
    request: NextRequest,
    pathname: string,
    requestId: string
): Promise<NextResponse> {
    // Portal login page is always accessible
    if (pathname === '/portal/login') {
        const response = NextResponse.next();
        response.headers.set('X-Request-ID', requestId);
        return response;
    }

    // CHANGED: Validate the session properly
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.warn(`[PORTAL] Unauthenticated portal access attempt (Request ID: ${requestId})`);
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        // ADDED: Verify user is a valid portal user (exists in client_users table)
        const { data: clientUser, error: clientUserError } = await supabase
            .from('client_users')
            .select('id, client_id')
            .eq('user_id', user.id)
            .single();

        if (clientUserError || !clientUser) {
            console.warn(`[PORTAL] User ${user.id} not found in client_users table (Request ID: ${requestId})`);
            
            // Redirect to login with error message
            const loginUrl = new URL('/portal/login', request.url);
            loginUrl.searchParams.set('error', 'invalid_portal_user');
            return NextResponse.redirect(loginUrl);
        }

        // ADDED: Set client ID header for downstream components
        response.headers.set('x-client-id', clientUser.client_id);
        response.headers.set('x-user-id', user.id);
        response.headers.set('x-request-id', requestId);

        return response;

    } catch (error) {
        console.error(`[PORTAL] Middleware error (Request ID: ${requestId}):`, error);
        
        return new NextResponse('Portal authentication service unavailable', {
            status: 503,
            headers: { 'X-Request-ID': requestId },
        });
    }
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Configure which routes the middleware runs on.
 * 
 * CHANGED: Improved regex to exclude more static assets for performance.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes - have their own auth)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, robots.txt, sitemap.xml
         * - public files (images, fonts, etc.)
         */
         // List all routes that need authentication/rate limiting
        '/dashboard/:path*',
        '/intake/:path*',
        '/directory/:path*',
        '/reports/:path*',
        '/follow-ups/:path*',
        '/documents/:path*',
        '/settings/:path*',
        '/supervisor/:path*',
        '/auditor/:path*',
        '/compliance/:path*',
        '/portal/:path*',
    ],
};
