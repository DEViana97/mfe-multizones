import { ProductCard } from '@/components/ProductCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Produtos | MFE Store',
  description: 'Confira nossa seleção de produtos.',
}

async function getProducts() {
  const res = await fetch('https://fakestoreapi.com/products?limit=8', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Falha ao buscar produtos')
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <section style={{ padding: 24 }}>
      <h1>Produtos</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
