import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['rjqjjudatklqdrynuati.supabase.co'], // ✅ Add your Supabase storage domain here
  },
  // Optimize server-side rendering and prevent hanging
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add timeout for server components
  serverComponentsExternalPackages: ['@supabase/ssr'],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/favicon.ico',
          destination: '/logo.png?v=2',
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/logo.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Prevent caching of RSC payloads to avoid stale data
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
