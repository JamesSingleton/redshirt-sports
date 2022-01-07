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
const mapModuleIds = (fn) => (compiler) => {
  const { context } = compiler.options

  compiler.hooks.compilation.tap('ChangeModuleIdsPlugin', (compilation) => {
    compilation.hooks.beforeModuleIds.tap(
      'ChangeModuleIdsPlugin',
      (modules) => {
        const { chunkGraph } = compilation
        for (const module of modules) {
          if (module.libIdent) {
            const origId = module.libIdent({ context })
            // eslint-disable-next-line
            if (!origId) continue
            const namedModuleId = fn(origId, module)
            if (namedModuleId) {
              chunkGraph.setModuleId(module, namedModuleId)
            }
          }
        }
      }
    )
  })
}
const withNamedLazyChunks = (nextConfig = {}) =>
  Object.assign({}, nextConfig, {
    webpack: (config, options) => {
      config.plugins.push(
        mapModuleIds((id, module) => {
          if (
            id.includes('./components/post/RelatedArticles/index.ts') ||
            id.includes('./components/common/Footer/index.ts') ||
            id.includes('./components/common/Footer/Footer.tsx')
          ) {
            return `lazy-${module.debugId}`
          }
          return false
        })
      )

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    },
  })
/** @type {import('next').NextConfig} */
module.exports = withPlausibleProxy()(
  withNamedLazyChunks({
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
  })
)
