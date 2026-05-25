'use client'

import { useState } from 'react'

interface CartItem {
  id:       number
  title:    string
  price:    number
  quantity: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  )

  if (items.length === 0) {
    return (
      <section style={{ padding: 24 }}>
        <h1>Carrinho</h1>
        <p>Nenhum item adicionado.</p>
        {/* Link para products usa <a> — zona diferente */}
        <a href="/products" style={{ color: '#3b82f6' }}>
          ← Ver produtos
        </a>
      </section>
    )
  }

  return (
    <section style={{ padding: 24 }}>
      <h1>Carrinho ({items.length} itens)</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <span>{item.title} x{item.quantity}</span>
            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
            <button
              onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
              aria-label={`Remover ${item.title}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <p style={{ fontWeight: 'bold', marginTop: 16 }}>
        Total: R$ {total.toFixed(2)}
      </p>
    </section>
  )
}
