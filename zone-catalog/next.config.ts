import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? '/catalog-static'
    : undefined,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
    ],
  },

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
