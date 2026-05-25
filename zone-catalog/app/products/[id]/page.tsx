import type { Metadata } from 'next'

export const revalidate = 60

async function getProduct(id: string) {
  const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error('Produto não encontrado')
  return res.json()
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
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

  return (
    <article style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <img
        src={product.image}
        alt={product.title}
        style={{ width: '100%', height: 300, objectFit: 'contain' }}
      />
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
