const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const moduleExports = {
  experimental: { appDir: true },
  productionBrowserSourceMaps: true,
  swcMinify: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['cdn.sanity.io', 'pbs.twimg.com'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? true : false,
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
  webpack(config, { dev, isServer, nextRuntime, webpack }) {
    if (!dev && isServer && nextRuntime === 'nodejs') {
      let originalEntry = config.entry

      config.entry = async () => {
        let entries = { ...(await originalEntry()) }
        entries['lib/build-rss'] = './lib/build-rss.js'
        return entries
      }
    }

    return config
  },
  async redirects() {
    return [
      {
        source: '/authors',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/advertising',
        destination: '/contact',
        permanent: true,
      },
    ]
  },
  sentry: {
    excludeServerRoutes: ['/api/og', '/api/article-og', '/api/category-og'],
  },
}

const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

/** @type {import('next').NextConfig} */
module.exports = withSentryConfig(
  withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(moduleExports),
  SentryWebpackPluginOptions
)
