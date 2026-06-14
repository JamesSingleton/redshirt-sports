import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

export const config: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  reactCompiler: true,
  logging: {
    fetches: {},
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
