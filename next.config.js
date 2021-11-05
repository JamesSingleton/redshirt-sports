/** @type {import('next').NextConfig} */
module.exports = {
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
    ],
  },
  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  },
}
