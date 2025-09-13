import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    inlineCss: true,
  },
}

export default nextConfig
