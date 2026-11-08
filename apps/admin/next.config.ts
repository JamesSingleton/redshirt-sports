import { config, withAnalyzer } from "@redshirt-sports/next-config";
import { withSentry } from "@redshirt-sports/observability/next-config";
import type { NextConfig } from "next";
import { sanity } from "next-sanity/live/cache-life";

import { env } from "@/env";

let nextConfig: NextConfig = config;

nextConfig = {
  ...nextConfig,
  cacheComponents: true,
  cacheLife: { default: sanity },
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
