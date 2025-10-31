import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "ik.imagekit.io",
  //       port: "",
  //     },
  //   ],
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Optimize client-side navigation
    optimizePackageImports: ["@/components"],
    // Enable parallel routes for faster navigation
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Optimize for faster navigation
  reactStrictMode: false, // Disable strict mode in development to reduce re-renders
};

export default nextConfig;
