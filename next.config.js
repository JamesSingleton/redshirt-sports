const withPWA = require('next-pwa')

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
]
/** @type {import('next').NextConfig} */
module.exports = withPWA({
  swcMinify: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'tailwindui.com',
      'images.unsplash.com',
      'herosports.com',
      'vmikeydets.com',
      'www.ncaa.com',
      'images2.minutemediacdn.com',
      'cdn.sanity.io',
    ],
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
  pwa: {
    dest: 'public',
  },
})
