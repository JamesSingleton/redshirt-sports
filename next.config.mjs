import { withSentryConfig } from '@sentry/nextjs'
import { createClient } from '@sanity/client'

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-06-21',
})

// https://nextjs.org/docs/advanced-features/security-headers
const ContentSecurityPolicy = `
    default-src 'self' vercel.live;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' plausible.io vercel.live *.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src * blob: data: https://img.clerk.com https://cdn.sanity.io;
    media-src 'none';
    connect-src *;
    font-src 'self' fonts.gstatic.com;
    frame-src 'self' https://challenges.cloudflare.com;
    worker-src 'self' blob:;
`

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
]

const nextConfig = {
  experimental: {
    optimizePackageImports: ['tailwindcss', '@portabletext/react'],
    instrumentationHook: true,
  },
  logging: {
    level: 'verbose',
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'all',
          },
        ],
      },
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    const query =
      '*[_type == "redirect" && !(_id in path("drafts.**"))]{source,destination,permanent}'
    const results = await client.fetch(query)
    return results
  },
}

/** @type {import('next').NextConfig} */
export default withSentryConfig(nextConfig, {
  org: 'james-singleton',
  project: 'redshirt-sports',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
})
