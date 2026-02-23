/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cache bust: 2026-02-23-15:10
  experimental: {},
};

export default nextConfig;
