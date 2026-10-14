import { config, withAnalyzer } from "@redshirt-sports/next-config";
import type { NextConfig } from "next";

import { env } from "@/env";

let nextConfig: NextConfig = {
  ...config,
  cacheComponents: true,
};

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
