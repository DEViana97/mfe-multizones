import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

const mockProduct = { id: 1, title: 'Produto Teste', price: 99.9, image: 'img.jpg' }

describe('ProductCard', () => {
  it('renderiza o nome do produto', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Produto Teste')).toBeInTheDocument()
  })

  it('renderiza o preço formatado', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('R$ 99.90')).toBeInTheDocument()
  })

  it('tem link para o detalhe do produto', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByRole('link', { name: 'Ver detalhes' }))
      .toHaveAttribute('href', '/products/1')
  })
})
