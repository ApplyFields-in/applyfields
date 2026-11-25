import type { NextConfig } from 'next';

// Accepts the env with or without /api/v1 (Vercel has it with), so the proxy never doubles it.
// No env on a Vercel build → the live API, not localhost (the services portal shipped without it).
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? (process.env.VERCEL ? 'https://applyfields.onrender.com' : 'http://localhost:4000')
)
  .replace(/\/$/, '')
  .replace(/\/api\/v1$/, '');

const nextConfig: NextConfig = {
  transpilePackages: ['@applyfields/ui'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
