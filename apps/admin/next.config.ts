import { config, withAnalyzer } from "@redshirt-sports/next-config";
import { sanity } from "next-sanity/live/cache-life";
import type { NextConfig } from "next";

import { env } from "@/env";

let nextConfig: NextConfig = config;

nextConfig = {
  ...nextConfig,
  cacheComponents: true,
  cacheLife: { default: sanity },
};

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
