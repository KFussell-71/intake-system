/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

// Basic protection: Obfuscate production builds
import WebpackObfuscator from 'webpack-obfuscator';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    // ... existing PWA config ...
    register: true,
    skipWaiting: true,
    reloadOnOnline: true,
    runtimeCaching: [
        {
            urlPattern: /^\/(intake|directory|dashboard)/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'pages-cache',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
            },
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'image-cache',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                },
            },
        },
    ],
});

const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',

    // Memory optimization: Dispose inactive pages quickly in development
    onDemandEntries: {
        maxInactiveAge: 25 * 1000, // Dispose inactive pages after 25 seconds
        pagesBufferLength: 2, // Keep only 2 pages in memory
    },

    webpack: (config, { dev, isServer }) => {
        // Only obfuscate client-side production builds
        if (!dev && !isServer) {
            config.plugins.push(
                new WebpackObfuscator({
                    rotateStringArray: true,
                    stringArray: true,
                    stringArrayThreshold: 0.75
                }, [])
            );
        }

        // Fix isomorphic-dompurify ENOENT error in Next.js 15
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                'isomorphic-dompurify': 'commonjs isomorphic-dompurify'
            });
        }

        // Reduce memory usage with deterministic module IDs
        config.optimization = {
            ...config.optimization,
            moduleIds: 'deterministic',
        };

        return config;
    },

    // Image Optimization (Quick Win #4)
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    // Performance optimizations
    // swcMinify is enabled by default in Next.js 13+

    // Experimental features for better performance and memory usage
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    },

    // SECURITY: Defense-in-Depth Headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co https://*.googleapis.com ws: wss:;",
                    }
                ],
            },
        ];
    },
};

export default withPWA(nextConfig);
