import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
  /* eslint: {
    // Warning: This will skip *all* lint errors during `next build`
    ignoreDuringBuilds: true,
  }, */
  /* typescript: {
    // Warning: This will skip *all* TypeScript errors during `next build`
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable static optimization for pages that use dynamic imports
    optimizePackageImports: [],
  }, */
};

export default nextConfig;



