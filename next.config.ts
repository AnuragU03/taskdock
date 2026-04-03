import type { NextConfig } from "next";

const nextConfig = {
  distDir: 'build',
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
} as NextConfig;

export default nextConfig;
