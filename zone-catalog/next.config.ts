import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? '/catalog-static'
    : undefined,

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.SHELL_DOMAIN || '',
      ].filter(Boolean),
    },
  },
}

export default nextConfig
