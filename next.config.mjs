/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force rebuild: 2026-02-23-16:21 - H1 detection restored, cache cleared
  experimental: {},
};

export default nextConfig;
