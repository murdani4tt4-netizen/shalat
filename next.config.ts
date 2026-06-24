import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external image resources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Server packages that should not be bundled for the browser
  serverExternalPackages: ["canvas"],
  // Turbopack config (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      fs: { browser: "./empty-module.js" },
      path: { browser: "./empty-module.js" },
      crypto: { browser: "./empty-module.js" },
      canvas: { browser: "./empty-module.js" },
    },
  },
  // Webpack fallback for canvas (used by @vladmandic/face-api)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;