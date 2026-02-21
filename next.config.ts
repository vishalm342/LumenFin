import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',           // Enables minimal Docker-friendly bundle
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
