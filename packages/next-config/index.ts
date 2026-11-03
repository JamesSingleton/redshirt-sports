import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// No experimental.inlineCss: it put the full stylesheet (~157 kB) into every
// page's HTML and three more times into its RSC payload, ~700 kB of an ~840 kB
// page, re-sent on every origin fetch. External CSS is one immutable file
// browsers and the CDN cache.
export const config: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
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
