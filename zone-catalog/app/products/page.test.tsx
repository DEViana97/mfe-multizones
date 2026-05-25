import { render, screen } from '@testing-library/react'

global.fetch = jest.fn().mockResolvedValue({
  ok:   true,
  json: () => Promise.resolve([
    { id: 1, title: 'Produto A', price: 10, image: 'img.jpg' },
    { id: 2, title: 'Produto B', price: 20, image: 'img.jpg' },
  ]),
})

import ProductsPage from './page'

describe('ProductsPage', () => {
  it('renderiza o título', async () => {
    const Page = await ProductsPage()
    render(Page)
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
  })
})
