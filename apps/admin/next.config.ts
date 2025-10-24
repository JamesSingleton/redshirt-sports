import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    inlineCss: true,
  },
}

export default nextConfig
