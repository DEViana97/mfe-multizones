import Image from 'next/image'

export interface Product {
  id:    number
  title: string
  price: number
  image: string
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article style={{
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ position: 'relative', height: 160 }}>
        <Image
          src={product.image}
          alt={product.title}
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <h2 style={{ fontSize: 14, margin: 0 }}>{product.title}</h2>
      <p style={{ fontWeight: 'bold', margin: 0 }}>
        R$ {product.price.toFixed(2)}
      </p>
      <a href={`/products/${product.id}`}>
        Ver detalhes
      </a>
    </article>
  )
}
