import { withAnalyzer } from "@redshirt-sports/next-config";
import { withSentry } from "@redshirt-sports/observability/next-config";
import { createClient } from "@sanity/client";
import type { NextConfig } from "next";
import { sanity } from "next-sanity/live/cache-life";

import { env } from "@/env";

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV === "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-06-12",
});

const sanityStudioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL;
const sanityStudioOrigins = [
  "'self'",
  "http://localhost:3333",
  ...(sanityStudioUrl ? [sanityStudioUrl] : []),
].join(" ");

// https://nextjs.org/docs/advanced-features/security-headers
const ContentSecurityPolicy = `
    default-src 'self' vercel.live;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' plausible.io vercel.live https://electric-alien-91.clerk.accounts.dev https://clerk.redshirtsports.xyz https://challenges.cloudflare.com https://va.vercel-scripts.com https://us-assets.i.posthog.com;
    style-src 'self' 'unsafe-inline';
    img-src * blob: data: https://img.clerk.com https://cdn.sanity.io;
    media-src 'none';
    connect-src * https://clerk.redshirtsports.xyz https://electric-alien-91.clerk.accounts.dev https://us.i.posthog.com https://us.posthog.com;
    font-src 'self' fonts.gstatic.com;
    frame-src 'self' https://challenges.cloudflare.com https://vercel.live https://www.youtube.com;
    frame-ancestors ${sanityStudioOrigins};
    worker-src 'self' blob:;
`;

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\n/g, ""),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  // Framing is controlled via CSP frame-ancestors (allows Sanity Presentation iframe).
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

let nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: { default: sanity },
  reactCompiler: true,
  experimental: {
    inlineCss: true,
  },
  logging: {
    fetches: {},
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: "/:path*",
        headers: [
          {
            key: "x-robots-tag",
            value: "all",
          },
        ],
      },
      {
        // Exclude https://clerk.redshirtsports.xyz from robots
        source: "/:path*",
        headers: [
          {
            key: "x-robots-tag",
            value: "noindex, nofollow",
          },
        ],
        has: [
          {
            type: "host",
            value: "clerk.redshirtsports.xyz",
          },
        ],
      },
      {
        // Apply these headers to all routes in your application.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    const query =
      '*[_type == "redirect" && !(_id in path("drafts.**")) && defined(source.current) && defined(destination.current)]{source,destination,permanent}';
    const results = await client.fetch<
      Array<{
        source: { current: string };
        destination: { current: string };
        permanent?: boolean;
      }>
    >(query);

    return results
      .filter(
        (redirect) =>
          redirect.source.current.startsWith("/") &&
          redirect.destination.current.startsWith("/"),
      )
      .map((redirect) => ({
        source: redirect.source.current,
        destination: redirect.destination.current,
        permanent: redirect.permanent === true,
      }));
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
