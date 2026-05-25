import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'MFE Store',
  description: 'Projeto de estudos Multi-Zones com Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
        }}>
          <Link href="/" style={{ fontWeight: 'bold', fontSize: 20, textDecoration: 'none', color: '#1e293b' }}>
            MFE Store
          </Link>

          <nav aria-label="Navegação principal">
            {/* /products → zone-catalog, /cart → zone-cart — usar <a>, não <Link> */}
            <a href="/products" style={{ marginRight: 24, color: '#3b82f6' }}>
              Produtos
            </a>
            <a href="/cart" style={{ color: '#3b82f6' }}>
              Carrinho
            </a>
          </nav>
        </header>

        <main id="main-content">
          {children}
        </main>

        <footer style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          Projeto de estudos — Multi-Zones Next.js
        </footer>
      </body>
    </html>
  )
}
