import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // compile the shared design system straight from its TypeScript source
  transpilePackages: ['@applyfields/ui'],
};

export default nextConfig;
