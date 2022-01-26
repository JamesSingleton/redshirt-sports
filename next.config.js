const { withPlausibleProxy } = require('next-plausible')

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
    value: 'origin-when-cross-origin',
  },
]
/** @type {import('next').NextConfig} */
module.exports = withPlausibleProxy()({
  productionBrowserSourceMaps: true,
  swcMinify: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['cdn.sanity.io', 'images.unsplash.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'all',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  webpack(config, options) {
    if (!options.dev && options.isServer) {
      let originalEntry = config.entry

      config.entry = async () => {
        let entries = { ...(await originalEntry()) }
        entries['lib/build-rss'] = './lib/build-rss.js'
        return entries
      }
    }

    return config
  },
})
