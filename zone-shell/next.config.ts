import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const CATALOG_URL = isProd
  ? process.env.CATALOG_DOMAIN
  : 'http://localhost:3001'

const CART_URL = isProd
  ? process.env.CART_DOMAIN
  : 'http://localhost:3002'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source:      '/products',
        destination: `${CATALOG_URL}/products`,
      },
      {
        source:      '/products/:path*',
        destination: `${CATALOG_URL}/products/:path*`,
      },
      {
        source:      '/catalog-static/:path*',
        destination: `${CATALOG_URL}/catalog-static/:path*`,
      },
      {
        source:      '/cart',
        destination: `${CART_URL}/cart`,
      },
      {
        source:      '/cart/:path*',
        destination: `${CART_URL}/cart/:path*`,
      },
      {
        source:      '/cart-static/:path*',
        destination: `${CART_URL}/cart-static/:path*`,
      },
    ]
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.SHELL_DOMAIN || ''].filter(Boolean),
    },
  },
}

export default nextConfig
