import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75, 82, 86, 90],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(
          process.env.NEXT_PUBLIC_SUPABASE_URL ??
            "https://uemzeptlqjbnurclfkkx.supabase.co",
        ).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
