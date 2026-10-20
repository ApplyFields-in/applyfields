import type { NextConfig } from 'next';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Strip trailing /api/v1 and trailing slashes so rewrite destination doesn't double-prefix /api/v1
const BACKEND_BASE = RAW_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  transpilePackages: ['@applyfields/ui'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_BASE}/api/v1/:path*`,
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
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
