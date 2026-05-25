import Image from 'next/image'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

async function getProduct(id: string) {
  try {
    const res = await fetch(`https://fakestoreapi.com/products/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Produto | MFE Store' }
  return {
    title:       `${product.title} | MFE Store`,
    description: product.description,
    openGraph:   { images: [product.image] },
  }
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <section style={{ padding: 24 }}>
        <p style={{ color: '#64748b' }}>Produto não encontrado.</p>
        <a href="/products" style={{ color: '#3b82f6' }}>← Ver produtos</a>
      </section>
    )
  }

  return (
    <article style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ position: 'relative', height: 300 }}>
        <Image
          src={product.image}
          alt={product.title}
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <h1>{product.title}</h1>
      <p style={{ fontSize: 24, fontWeight: 'bold' }}>
        R$ {product.price.toFixed(2)}
      </p>
      <p>{product.description}</p>

      {/* Link para o carrinho usa <a> — /cart pertence ao zone-cart (zona diferente) */}
      <a href="/cart" style={{ color: '#3b82f6' }}>
        Ir para o carrinho →
      </a>
    </article>
  )
}
