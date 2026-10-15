import { config, withAnalyzer } from "@redshirt-sports/next-config";
import type { NextConfig } from "next";
import { sanity } from "next-sanity/live/cache-life";

import { env } from "@/env";

let nextConfig: NextConfig = config;

nextConfig = {
  ...nextConfig,
  cacheComponents: true,
  cacheLife: { default: sanity },
  experimental: {
    ...nextConfig.experimental,
    authInterrupts: true,
  },
};

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
