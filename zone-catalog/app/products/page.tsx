import { ProductCard, type Product } from '@/components/ProductCard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Produtos | MFE Store',
  description: 'Confira nossa seleção de produtos.',
}

interface DummyProduct {
  id:        number
  title:     string
  price:     number
  thumbnail: string
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=8')
    if (!res.ok) return []
    const data = await res.json()
    return (data.products as DummyProduct[]).map((p) => ({
      id:    p.id,
      title: p.title,
      price: p.price,
      image: p.thumbnail,
    }))
  } catch {
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <section style={{ padding: 24 }}>
      <h1>Produtos</h1>
      {products.length === 0 ? (
        <p style={{ color: '#64748b' }}>
          Não foi possível carregar os produtos. Tente novamente.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
