import type { NextConfig } from "next";

const nextConfig = {
  distDir: 'build',
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  outputFileTracingIncludes: {
    '/*': ['./prisma/**/*', './node_modules/.prisma/**/*', './node_modules/@prisma/engines/**/*'],
  },
} as NextConfig;

export default nextConfig;
