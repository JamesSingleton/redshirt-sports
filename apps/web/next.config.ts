import { config, withAnalyzer } from "@redshirt-sports/next-config";
import { withSentry } from "@redshirt-sports/observability/next-config";
import {
  apiVersion,
  dataset,
  projectId,
  studioUrl,
} from "@redshirt-sports/sanity/api";
import { createClient } from "@sanity/client";
import type { NextConfig } from "next";
import type { Header } from "next/dist/lib/load-custom-routes";
import { sanity } from "next-sanity/live/cache-life";

import { env } from "@/env";

const client = createClient({
  dataset,
  projectId,
  useCdn: process.env.NODE_ENV === "production",
  apiVersion,
});

const sanityStudioOrigins = [
  "'self'",
  "http://localhost:3333",
  ...(studioUrl ? [studioUrl] : []),
].join(" ");

const clerkDomain = env.NEXT_PUBLIC_CLERK_DOMAIN;
const clerkOrigin = clerkDomain
  ? clerkDomain.startsWith("http")
    ? clerkDomain
    : `https://${clerkDomain}`
  : undefined;
const clerkHost = clerkDomain
  ? clerkDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
  : undefined;

// Clerk Frontend API host for this application instance (not a brand domain).
const clerkFrontendApi = "https://electric-alien-91.clerk.accounts.dev";

// https://nextjs.org/docs/advanced-features/security-headers
const ContentSecurityPolicy = `
    default-src 'self' vercel.live;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' plausible.io vercel.live ${clerkFrontendApi} ${clerkOrigin ?? ""} https://challenges.cloudflare.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com;
    style-src 'self' 'unsafe-inline' https://*.posthog.com https://*.i.posthog.com;
    img-src * blob: data: https://img.clerk.com https://cdn.sanity.io https://*.posthog.com https://*.i.posthog.com;
    media-src 'none';
    connect-src * ${clerkFrontendApi} ${clerkOrigin ?? ""};
    font-src 'self' fonts.gstatic.com https://*.posthog.com https://*.i.posthog.com;
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
  ...config,
  cacheComponents: true,
  cacheLife: { default: sanity },
  async headers() {
    const headers: Header[] = [
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
        // Apply these headers to all routes in your application.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];

    if (clerkHost) {
      headers.splice(1, 0, {
        // Exclude the Clerk custom domain from robots when it shares this app
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
            value: clerkHost,
          },
        ],
      });
    }

    return headers;
  },
  async redirects() {
    const query =
      '*[_type == "redirect" && !(_id in path("drafts.**")) && defined(source.current) && defined(destination.current)]{source,destination,permanent}';
    const results =
      await client.fetch<
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
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
