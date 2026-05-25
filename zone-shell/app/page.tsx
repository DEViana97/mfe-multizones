import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | MFE Store',
}

export default function HomePage() {
  return (
    <section style={{ padding: 24 }}>
      <h1>Bem-vindo à MFE Store</h1>
      <p>
        Este projeto demonstra a arquitetura Multi-Zones do Next.js —
        cada seção é uma aplicação independente com deploy separado.
      </p>

      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <a
          href="/products"
          style={{
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Ver produtos →
        </a>
        <a
          href="/cart"
          style={{
            border: '2px solid #3b82f6',
            color: '#3b82f6',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Ver carrinho →
        </a>
      </div>
    </section>
  )
}
