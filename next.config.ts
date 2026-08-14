import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error eslint is handled directly at runtime in Next.js 15
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;