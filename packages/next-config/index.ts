import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

export const config: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
