# 🗺️ Prompt — Micro-frontends com Next.js Multi-Zones (Projeto de Estudos)

## Contexto

Você está construindo um projeto de estudos sobre Micro-frontends usando
**Next.js Multi-Zones** — a abordagem oficial e nativa do Next.js para
micro-frontends, recomendada pela Vercel como substituta ao Module Federation.

O projeto é o mesmo e-commerce de estudos, mas agora cada parte é uma
**aplicação Next.js independente**, servindo um conjunto de rotas sob o
mesmo domínio.

---

## O que é Multi-Zones (entenda antes de começar)

Multi-Zones divide uma aplicação grande em aplicações Next.js menores, cada
uma responsável por um conjunto de rotas. O usuário acessa sempre o mesmo
domínio e não percebe que são apps separadas.

```
mfe-estudos.vercel.app/           → zone-shell    (home, layout global)
mfe-estudos.vercel.app/products   → zone-catalog  (catálogo de produtos)
mfe-estudos.vercel.app/cart       → zone-cart     (carrinho)
```

### Diferença fundamental em relação ao Module Federation

```
Module Federation                 Multi-Zones
─────────────────                 ────────────
Componente a componente           Rota a rota
Runtime no browser                Proxy no servidor
Webpack obrigatório               Nativo do Next.js
SSR complexo                      SSR nativo por zona
Plugin externo                    Zero configuração extra
```

### Soft navigation vs Hard navigation

Navegar entre páginas da **mesma zona** é uma soft navigation (sem reload,
como um SPA). Navegar entre zonas diferentes é uma hard navigation (recarrega
os recursos da nova zona). Por isso páginas frequentemente acessadas juntas
devem ficar na mesma zona.

---

## Arquitetura do Projeto

```
mfe-multizones/
├── zone-shell/       → porta 3000 — home, layout, roteamento global
├── zone-catalog/     → porta 3001 — /products e /products/[id]
└── zone-cart/        → porta 3002 — /cart e /checkout
```

Cada pasta é uma aplicação Next.js independente com seu próprio
`package.json` e `next.config.ts`.

---

## ETAPA 1 — Criar os 3 projetos

### 1.1 — Criar a pasta raiz

```bash
mkdir mfe-multizones
cd mfe-multizones
npm init -y
npm install --save-dev concurrently
```

Edite o `package.json` raiz:

```json
{
  "name": "mfe-multizones",
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix zone-shell\" \"npm run dev --prefix zone-catalog\" \"npm run dev --prefix zone-cart\"",
    "build:all": "npm run build --prefix zone-catalog && npm run build --prefix zone-cart && npm run build --prefix zone-shell",
    "install:all": "npm install --prefix zone-shell && npm install --prefix zone-catalog && npm install --prefix zone-cart"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### 1.2 — Criar zone-shell

```bash
npx create-next-app@latest zone-shell \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

### 1.3 — Criar zone-catalog

```bash
npx create-next-app@latest zone-catalog \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

### 1.4 — Criar zone-cart

```bash
npx create-next-app@latest zone-cart \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

### 1.5 — Instalar dependências de teste nos 3 projetos

```bash
# Repetir nos 3 projetos (zone-shell, zone-catalog, zone-cart)
cd zone-shell
npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  @types/jest
cd ..
```

---

## ETAPA 2 — Configurar o zone-catalog (porta 3001)

O zone-catalog é responsável pelas rotas `/products` e `/products/[id]`.
Ele precisa de um `assetPrefix` para que seus assets (JS, CSS) não
conflitem com os de outras zonas.

### zone-catalog/next.config.ts

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // assetPrefix evita conflito de assets entre zonas
  // Os arquivos JS/CSS ficam em /catalog-static/_next/...
  // em vez de /_next/... (que seria igual nas outras zonas)
  assetPrefix: process.env.NODE_ENV === 'production'
    ? '/catalog-static'
    : undefined,  // em dev não precisa — cada zona roda em porta diferente

  // Garante que Server Actions aceitam requests do domínio principal
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.SHELL_DOMAIN || '',
      ].filter(Boolean),
    },
  },
}

export default nextConfig
```

> **Por que `assetPrefix`?**
> Em produção, todas as zonas são servidas pelo mesmo domínio. Sem o prefixo,
> o arquivo `/_next/static/chunks/main.js` do zone-catalog sobrescreveria o
> mesmo arquivo do zone-shell. O prefixo `/catalog-static` garante que os
> assets ficam em `/catalog-static/_next/...` — único por zona.

### Estrutura de arquivos do zone-catalog

```
zone-catalog/
├── app/
│   ├── products/
│   │   ├── page.tsx          ← listagem de produtos (SSG)
│   │   └── [id]/
│   │       └── page.tsx      ← detalhe do produto (ISR)
│   └── layout.tsx            ← layout mínimo (sem header — vem do shell)
├── components/
│   └── ProductCard.tsx
├── hooks/
│   └── useProducts.ts
└── next.config.ts
```

> **Importante:** o zone-catalog NÃO tem header nem navegação global.
> Esses elementos vivem no zone-shell e são carregados na hard navigation.

### zone-catalog/app/layout.tsx

```tsx
// Layout mínimo — sem header, sem footer
// O layout global vem do zone-shell
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

### zone-catalog/app/products/page.tsx — Listagem (SSG)

```tsx
import { ProductCard } from '@/components/ProductCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Produtos | MFE Store',
  description: 'Confira nossa seleção de produtos.',
}

// SSG — gerado em build, sem revalidate
// Para ISR, adicione: export const revalidate = 60
async function getProducts() {
  const res = await fetch('https://fakestoreapi.com/products?limit=8', {
    next: { revalidate: 3600 }, // ISR — revalida a cada hora
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
```

### zone-catalog/app/products/[id]/page.tsx — Detalhe (ISR)

```tsx
import type { Metadata } from 'next'
// Links entre zonas DEVEM usar <a> em vez de <Link>
// O <Link> do Next.js tenta fazer soft navigation, que não funciona entre zonas

export const revalidate = 60  // ISR — revalida a cada 60 segundos

async function getProduct(id: string) {
  const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error('Produto não encontrado')
  return res.json()
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id)
  return {
    title:       `${product.title} | MFE Store`,
    description: product.description,
    openGraph:   { images: [product.image] },
  }
}

export default async function ProductDetailPage(
  { params }: { params: { id: string } }
) {
  const product = await getProduct(params.id)

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

      {/*
        Link para o carrinho usa <a> em vez de <Link>
        porque /cart pertence ao zone-cart (zona diferente)
        O <Link> do Next.js não funciona entre zonas
      */}
      <a href="/cart" style={{ color: '#3b82f6' }}>
        Ir para o carrinho →
      </a>
    </article>
  )
}
```

> **Regra crítica de Multi-Zones:**
> Use `<a>` para links entre zonas diferentes.
> Use `<Link>` apenas para links dentro da mesma zona.
> O `<Link>` do Next.js tenta fazer prefetch e soft navigation, o que não
> funciona entre zonas e causa erros silenciosos.

### zone-catalog/components/ProductCard.tsx

```tsx
interface Product {
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
      <img
        src={product.image}
        alt={product.title}
        style={{ width: '100%', height: 160, objectFit: 'contain' }}
      />
      <h2 style={{ fontSize: 14, margin: 0 }}>{product.title}</h2>
      <p style={{ fontWeight: 'bold', margin: 0 }}>
        R$ {product.price.toFixed(2)}
      </p>

      {/* Link dentro da mesma zona — pode usar <a> ou <Link> */}
      <a href={`/products/${product.id}`}>
        Ver detalhes
      </a>
    </article>
  )
}
```

---

## ETAPA 3 — Configurar o zone-cart (porta 3002)

### zone-cart/next.config.ts

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? '/cart-static'
    : undefined,

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.SHELL_DOMAIN || '',
      ].filter(Boolean),
    },
  },
}

export default nextConfig
```

### Estrutura do zone-cart

```
zone-cart/
├── app/
│   ├── cart/
│   │   └── page.tsx      ← carrinho (CSR — 'use client')
│   └── layout.tsx        ← layout mínimo
└── next.config.ts
```

### zone-cart/app/cart/page.tsx

```tsx
'use client'
// Carrinho é dinâmico e personalizado por usuário — CSR faz sentido

import { useState } from 'react'

interface CartItem {
  id:       number
  title:    string
  price:    number
  quantity: number
}

export default function CartPage() {
  // Em produção, este estado viria de um contexto global ou store
  // Para estudos, começa vazio
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
```

---

## ETAPA 4 — Configurar o zone-shell (porta 3000)

O zone-shell é o orquestrador. Ele:
- Serve a home (`/`)
- Tem o layout global (header, footer)
- Faz proxy das rotas das outras zonas via `rewrites`
- **Não precisa de `assetPrefix`** — é o app principal

### zone-shell/next.config.ts

```ts
import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// URLs de cada zona — diferentes em dev e produção
const CATALOG_URL = isProd
  ? process.env.CATALOG_DOMAIN  // ex: https://zone-catalog.vercel.app
  : 'http://localhost:3001'

const CART_URL = isProd
  ? process.env.CART_DOMAIN     // ex: https://zone-cart.vercel.app
  : 'http://localhost:3002'

const nextConfig: NextConfig = {
  // Shell não precisa de assetPrefix — é o app raiz
  async rewrites() {
    return [
      // Roteia /products/* para o zone-catalog
      {
        source:      '/products',
        destination: `${CATALOG_URL}/products`,
      },
      {
        source:      '/products/:path*',
        destination: `${CATALOG_URL}/products/:path*`,
      },
      // Roteia os assets estáticos do zone-catalog
      // (necessário para o CSS e JS carregarem corretamente)
      {
        source:      '/catalog-static/:path*',
        destination: `${CATALOG_URL}/catalog-static/:path*`,
      },

      // Roteia /cart/* para o zone-cart
      {
        source:      '/cart',
        destination: `${CART_URL}/cart`,
      },
      {
        source:      '/cart/:path*',
        destination: `${CART_URL}/cart/:path*`,
      },
      // Assets do zone-cart
      {
        source:      '/cart-static/:path*',
        destination: `${CART_URL}/cart-static/:path*`,
      },
    ]
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.SHELL_DOMAIN || ''].filter(Boolean),
    },
  },
}

export default nextConfig
```

> **Como o proxy funciona:**
> Quando o usuário acessa `localhost:3000/products`, o Next.js do shell
> faz uma requisição interna para `localhost:3001/products` e retorna
> o HTML como se fosse do próprio shell. O browser nunca sabe que existe
> outra aplicação.

### zone-shell/app/layout.tsx — Layout global com header

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
          {/* Link para a home — mesma zona, pode usar <a> simples */}
          <a href="/" style={{ fontWeight: 'bold', fontSize: 20, textDecoration: 'none', color: '#1e293b' }}>
            🛒 MFE Store
          </a>

          <nav aria-label="Navegação principal">
            {/*
              Todos os links usam <a> porque podem apontar para zonas diferentes.
              /products → zone-catalog (zona diferente)
              /cart     → zone-cart    (zona diferente)
              Usar <Link> aqui causaria erro de soft navigation entre zonas.
            */}
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
```

### zone-shell/app/page.tsx — Home (SSG)

```tsx
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
```

---

## ETAPA 5 — Variáveis de ambiente

### zone-shell/.env.local (desenvolvimento)

```bash
CATALOG_DOMAIN=http://localhost:3001
CART_DOMAIN=http://localhost:3002
```

### zone-shell/.env.production (produção)

```bash
CATALOG_DOMAIN=https://zone-catalog.vercel.app
CART_DOMAIN=https://zone-cart.vercel.app
SHELL_DOMAIN=mfe-multizones.vercel.app
```

---

## ETAPA 6 — Como rodar localmente

```bash
# Da pasta raiz mfe-multizones/
npm run dev

# Isso sobe os 3 projetos em paralelo:
# zone-catalog → http://localhost:3001
# zone-cart    → http://localhost:3002
# zone-shell   → http://localhost:3000 (acesse este)
```

> Acesse sempre pelo shell em `localhost:3000`.
> O shell faz proxy automático para as outras zonas.
> Você pode acessar `localhost:3001/products` diretamente, mas o layout
> global (header) não aparecerá — ele vive no shell.

---

## ETAPA 7 — Testes

### jest.config.js (igual nos 3 projetos)

```js
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
})
```

### jest.setup.ts (igual nos 3 projetos)

```ts
import '@testing-library/jest-dom'
```

### Testes do zone-catalog

```tsx
// app/products/page.test.tsx
import { render, screen } from '@testing-library/react'

// Mock do fetch global para não fazer requests reais
global.fetch = jest.fn().mockResolvedValue({
  ok:   true,
  json: () => Promise.resolve([
    { id: 1, title: 'Produto A', price: 10, image: 'img.jpg' },
    { id: 2, title: 'Produto B', price: 20, image: 'img.jpg' },
  ]),
})

// Server Components precisam ser importados como async
// e renderizados com await
import ProductsPage from './page'

describe('ProductsPage', () => {
  it('renderiza o título', async () => {
    const Page = await ProductsPage()
    render(Page)
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
  })
})
```

```tsx
// components/ProductCard.test.tsx
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
```

---

## ETAPA 8 — Deploy na Vercel

### 8.1 — Deploy das zonas (sem vercel.json — Next.js detectado automaticamente)

```bash
# Deploy do zone-catalog
cd zone-catalog
vercel
# Project name: zone-catalog
# Framework: Next.js ✅
# Anote a URL: https://zone-catalog.vercel.app

# Deploy do zone-cart
cd ../zone-cart
vercel
# Project name: zone-cart
# Anote a URL: https://zone-cart.vercel.app
```

### 8.2 — Configurar variáveis no painel da Vercel (zone-shell)

Antes de fazer o deploy do shell, configure as variáveis de ambiente
no painel da Vercel em Settings → Environment Variables:

```
CATALOG_DOMAIN = https://zone-catalog.vercel.app
CART_DOMAIN    = https://zone-cart.vercel.app
SHELL_DOMAIN   = mfe-multizones.vercel.app
```

### 8.3 — Deploy do shell

```bash
cd ../zone-shell
vercel
# Project name: mfe-multizones (ou o nome que preferir)
# Framework: Next.js ✅
```

### 8.4 — Ordem obrigatória

```
1. Deploy zone-catalog → anota URL
2. Deploy zone-cart    → anota URL
3. Configura variáveis no painel (shell)
4. Deploy zone-shell   → aplicação completa
```

---

## Conceitos aprendidos neste projeto

| Conceito | Onde aparece |
|---|---|
| Multi-Zones | arquitetura dos 3 projetos |
| `assetPrefix` | next.config.ts do catalog e cart |
| `rewrites` como proxy | next.config.ts do shell |
| `<a>` entre zonas | todos os links entre zonas |
| `<Link>` dentro da zona | links dentro da mesma zona |
| Hard vs soft navigation | navegação entre e dentro de zonas |
| Server Component async | ProductsPage, ProductDetailPage |
| ISR com `revalidate` | ProductDetailPage |
| SSG | ProductsPage (sem revalidate), HomePage |
| CSR com `'use client'` | CartPage |
| Metadata API | todas as páginas |
| Proxy transparente | shell fazendo rewrites para as zonas |
| Variáveis de ambiente | URLs das zonas por ambiente |

---

## Comparação final: o que você aprendeu em cada projeto

```
Projeto 1: Design System
→ Componentização, testes, acessibilidade, Storybook

Projeto 2: MFE com React + Webpack
→ Module Federation, exposes, remotes, shared deps

Projeto 3: Shell Next.js + MFEs React
→ MFELoader customizado, 'use client', SSR+CSR juntos

Projeto 4: Multi-Zones (este)
→ Padrão oficial Next.js/Vercel, proxy, assetPrefix,
  links entre zonas, deploy independente nativo
```

---

## Ordem de execução

```
Dia 1: Criar os 3 projetos + next.config.ts de cada um
       → Objetivo: npm run dev funcionando, shell em localhost:3000

Dia 2: zone-catalog — produtos + detalhe + testes

Dia 3: zone-cart — carrinho + testes

Dia 4: zone-shell — layout global + home + rewrites
       → Objetivo: navegação completa funcionando pelo shell

Dia 5: Testes de integração + ajustes de links (<a> vs <Link>)

Dia 6: Deploy na Vercel + README
```

---

## README (obrigatório ao final)

1. O que é Multi-Zones e por que substituiu o Module Federation no Next.js
2. Diagrama ASCII da arquitetura com as rotas de cada zona
3. Como rodar localmente (`npm run dev` na raiz)
4. Por que `assetPrefix` é necessário em produção
5. Por que usar `<a>` em vez de `<Link>` entre zonas
6. Comparação com Module Federation (quando usar cada um)
7. Como foi o deploy e a configuração das variáveis de ambiente

---

## ETAPA 9 — Repositório no GitHub

### 9.1 — Criar o .gitignore na raiz

Antes de qualquer commit, crie o `.gitignore` na raiz do projeto para
evitar subir arquivos desnecessários ou sensíveis:

```bash
cd mfe-multizones

cat > .gitignore << 'EOF'
# Dependências
node_modules/
**/node_modules/

# Build do Next.js
**/.next/
**/out/

# Variáveis de ambiente — NUNCA suba esses arquivos
**/.env.local
**/.env.production
**/.env*.local

# Vercel
**/.vercel/

# Logs
*.log
npm-debug.log*

# Sistema operacional
.DS_Store
Thumbs.db
EOF
```

> **Por que `.env.local` e `.env.production` no gitignore?**
> Esses arquivos contêm URLs e segredos de produção. Se subir para o GitHub
> público, qualquer pessoa pode ver as URLs internas do seu projeto. Cada
> desenvolvedor cria os seus localmente. As variáveis de produção ficam
> configuradas no painel da Vercel.

### 9.2 — Criar o README.md na raiz

```bash
cat > README.md << 'EOF'
# MFE Multi-Zones — Projeto de Estudos

Projeto de estudos sobre Micro-frontends usando **Next.js Multi-Zones**,
a abordagem oficial da Vercel para micro-frontends.

## Arquitetura

```
mfe-multizones/
├── zone-shell/     → porta 3000 — home, header, roteamento global
├── zone-catalog/   → porta 3001 — /products e /products/[id]
└── zone-cart/      → porta 3002 — /cart
```

## Como rodar localmente

```bash
# Instalar dependências de todos os projetos
npm run install:all

# Criar o arquivo de variáveis do shell
cp zone-shell/.env.example zone-shell/.env.local

# Subir os 3 projetos em paralelo
npm run dev
```

Acesse: http://localhost:3000

## Deploy

Cada zona é um projeto separado na Vercel com deploy independente.
EOF
```

### 9.3 — Criar arquivo .env.example no zone-shell

O `.env.example` documenta quais variáveis são necessárias, sem expor valores reais:

```bash
cat > zone-shell/.env.example << 'EOF'
# URL do zone-catalog (em dev: http://localhost:3001)
CATALOG_DOMAIN=http://localhost:3001

# URL do zone-cart (em dev: http://localhost:3002)
CART_DOMAIN=http://localhost:3002

# Domínio do shell em produção (somente produção)
# SHELL_DOMAIN=mfe-multizones.vercel.app
EOF
```

> **Por que `.env.example`?**
> É a convenção do mercado para documentar variáveis de ambiente sem expor
> valores reais. Outros desenvolvedores copiam este arquivo para `.env.local`
> e preenchem com seus próprios valores. O `.env.example` É commitado no Git.
> O `.env.local` NÃO É commitado.

### 9.4 — Inicializar o Git e criar o repositório

```bash
# Inicializa o repositório Git na pasta raiz
git init

# Adiciona todos os arquivos ao stage
git add .

# Primeiro commit
git commit -m "feat: estrutura inicial do projeto Multi-Zones"

# Renomeia a branch para main (padrão atual do GitHub)
git branch -M main
```

### 9.5 — Criar o repositório no GitHub

**Opção A — Via GitHub CLI (recomendado):**

```bash
# Instalar o GitHub CLI se não tiver:
# Mac:     brew install gh
# Windows: winget install GitHub.cli

# Fazer login
gh auth login

# Criar o repositório e conectar automaticamente
gh repo create mfe-multizones \
  --public \
  --description "Projeto de estudos — Multi-Zones com Next.js" \
  --source=. \
  --push
```

**Opção B — Via interface do GitHub:**

```bash
# 1. Acesse github.com/new
# 2. Nome: mfe-multizones
# 3. Deixe sem README (já temos um)
# 4. Clique em "Create repository"
# 5. Copie a URL e rode:

git remote add origin https://github.com/seu-usuario/mfe-multizones.git
git push -u origin main
```

### 9.6 — Fluxo de trabalho diário com Git

Use Conventional Commits para manter o histórico legível e profissional:

```bash
# Tipos de commit:
# feat     → nova funcionalidade
# fix      → correção de bug
# test     → adição ou correção de testes
# chore    → configuração, dependências
# docs     → documentação
# refactor → refatoração sem mudança de comportamento
# style    → formatação, sem mudança de lógica

# Exemplos reais do projeto:
git commit -m "feat(catalog): adiciona ProductCard com link para detalhe"
git commit -m "feat(cart): adiciona cálculo de total no CartPage"
git commit -m "fix(shell): corrige link entre zonas usando <a> em vez de <Link>"
git commit -m "chore(catalog): configura assetPrefix para produção"
git commit -m "test(catalog): adiciona testes do ProductCard"
git commit -m "docs: adiciona diagrama da arquitetura no README"
```

**Fluxo com branches:**

```bash
# Cria branch para a feature
git checkout -b feature/zone-catalog

# Desenvolve, commita...
git add .
git commit -m "feat(catalog): adiciona listagem de produtos com SSG"

# Quando terminar, volta para main e faz merge
git checkout main
git merge feature/zone-catalog
git push
```

---

## ETAPA 10 — Deploy na Vercel com GitHub

Agora que o projeto está no GitHub, vamos conectar na Vercel para deploy
automático. Cada zona é um projeto separado na Vercel.

### 10.1 — Instalar a Vercel CLI

```bash
npm install -g vercel
vercel login  # faz login com sua conta Vercel
```

### 10.2 — Deploy do zone-catalog

```bash
cd zone-catalog
vercel

# Responda as perguntas:
# Set up and deploy? Y
# Which scope? → sua conta
# Link to existing project? N
# Project name: zone-catalog
# Directory: ./
# Override settings? N
```

Anote a URL gerada. Exemplo: `https://zone-catalog-xyz.vercel.app`

### 10.3 — Deploy do zone-cart

```bash
cd ../zone-cart
vercel

# Project name: zone-cart
```

Anote a URL. Exemplo: `https://zone-cart-xyz.vercel.app`

### 10.4 — Configurar variáveis no painel da Vercel (zone-shell)

Antes do deploy do shell, acesse o painel da Vercel:

```
vercel.com → zone-catalog → Settings → Environment Variables

Adicione:
CATALOG_DOMAIN = https://zone-catalog-xyz.vercel.app  (URL real do catalog)
CART_DOMAIN    = https://zone-cart-xyz.vercel.app      (URL real do cart)
SHELL_DOMAIN   = mfe-multizones.vercel.app
```

### 10.5 — Deploy do zone-shell

```bash
cd ../zone-shell
vercel

# Project name: mfe-multizones
# Framework detected: Next.js ✅
```

### 10.6 — Conectar o GitHub para deploy automático

Após o primeiro deploy manual, conecte o GitHub para que o deploy
aconteça automaticamente a cada push:

```
1. Acesse vercel.com
2. Clique no projeto (ex: zone-catalog)
3. Settings → Git → Connect Git Repository
4. Selecione o repositório mfe-multizones
5. Root Directory: zone-catalog  ← importante!
6. Repita para zone-cart (Root Directory: zone-cart)
7. Repita para zone-shell (Root Directory: zone-shell)
```

> **Root Directory** é a configuração mais importante aqui. Sem ela, a
> Vercel tenta fazer build da pasta raiz do monorepo, que não é um projeto
> Next.js. Apontando para `zone-catalog`, ela faz build só daquela zona.

A partir daí, o fluxo é:

```
git push origin main
       ↓
GitHub notifica a Vercel
       ↓
Vercel faz build e deploy das 3 zonas automaticamente
       ↓
Preview URL gerada para cada commit
```

### 10.7 — Ordem obrigatória de deploy

```
1. Deploy zone-catalog → anota URL de produção
2. Deploy zone-cart    → anota URL de produção
3. Configura variáveis no painel do zone-shell
4. Deploy zone-shell   → aplicação completa no ar
```

---

## ETAPA 11 — CI/CD com GitHub Actions

CI/CD automatiza a validação do código a cada push — garantindo que
nada quebrado chega em produção.

> **CI** (Continuous Integration) — roda lint, type-check e testes
> automaticamente a cada push ou Pull Request.
>
> **CD** (Continuous Deployment) — faz deploy automático após o CI passar.
> No nosso caso, a Vercel já cuida do CD. O GitHub Actions cuida do CI.

### O que o CI vai fazer

```
Push / Pull Request
       ↓
GitHub Actions dispara
       ↓
Para cada zona (catalog, cart, shell):
  ├── lint       → ESLint verifica problemas no código
  ├── type-check → TypeScript verifica tipos
  └── test       → Jest roda os testes
       ↓
Se tudo passar → Vercel faz o deploy
Se algo falhar → deploy bloqueado + notificação no PR
```

### 11.1 — Criar o workflow de CI

Crie a pasta e o arquivo na raiz do projeto:

```bash
mkdir -p .github/workflows
touch .github/workflows/ci.yml
```

### 11.2 — Por que NÃO usar localhost no ci.yml

Uma dúvida comum é colocar as variáveis de ambiente assim no ci.yml:

```yaml
# ❌ ERRADO — não faça isso
env:
  CATALOG_DOMAIN: http://localhost:3001
  CART_DOMAIN: http://localhost:3002
```

O CI roda em um servidor do GitHub — não na sua máquina. Não existe nada
rodando em `localhost:3001` lá. Se o build tentar fazer um fetch server-side
para essa URL, vai falhar com erro de conexão.

Além disso, as URLs de produção são valores sensíveis que não devem ficar
visíveis no código. A solução correta é usar **GitHub Secrets**.

> **GitHub Secrets** — variáveis de ambiente seguras armazenadas no GitHub,
> disponíveis apenas para os workflows do CI. Não aparecem nos logs, não
> ficam no código e não são visíveis para quem vê o repositório.

### 11.3 — Configurar os GitHub Secrets

**Importante:** faça isso DEPOIS de ter feito o deploy das zonas na Vercel
e ter as URLs reais de produção.

```
GitHub → seu repositório → Settings → Secrets and variables → Actions
→ New repository secret

Adicione os 3 secrets:

Name:  CATALOG_DOMAIN
Value: https://zone-catalog-xyz.vercel.app   ← URL real do seu deploy

Name:  CART_DOMAIN
Value: https://zone-cart-xyz.vercel.app      ← URL real do seu deploy

Name:  SHELL_DOMAIN
Value: mfe-multizones.vercel.app             ← domínio do shell
```

### 11.4 — Conteúdo do ci.yml (com Secrets)

```yaml
# .github/workflows/ci.yml
name: CI

# Dispara em todo push e em Pull Requests para a branch main
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Job que roda lint, type-check e testes em cada zona
  quality:
    name: Quality Check — ${{ matrix.zone }}
    runs-on: ubuntu-latest

    # Matrix strategy — roda o mesmo job para as 3 zonas em paralelo
    # Sem matrix, você teria que duplicar o job 3 vezes
    strategy:
      matrix:
        zone: [zone-shell, zone-catalog, zone-cart]

    steps:
      # 1. Baixa o código do repositório
      - name: Checkout
        uses: actions/checkout@v4

      # 2. Configura o Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          # Cache das dependências — evita baixar node_modules toda vez
          # Reduz o tempo do CI de ~2min para ~30s
          cache: npm
          cache-dependency-path: ${{ matrix.zone }}/package-lock.json

      # 3. Instala as dependências da zona
      - name: Install dependencies
        working-directory: ${{ matrix.zone }}
        run: npm ci
        # npm ci é mais rápido e determinístico que npm install em CI
        # Usa o package-lock.json sem modificá-lo

      # 4. Roda o ESLint
      - name: Lint
        working-directory: ${{ matrix.zone }}
        run: npm run lint

      # 5. Verifica os tipos TypeScript
      - name: Type check
        working-directory: ${{ matrix.zone }}
        run: npx tsc --noEmit

      # 6. Roda os testes com cobertura
      - name: Test
        working-directory: ${{ matrix.zone }}
        run: npm test -- --coverage --passWithNoTests
        # --passWithNoTests: não falha se ainda não há testes
        # --coverage: gera relatório de cobertura

      # 7. Faz o build para garantir que compila sem erros
      - name: Build
        working-directory: ${{ matrix.zone }}
        run: npm run build
        env:
          # ✅ CORRETO — usa GitHub Secrets em vez de localhost
          # Secrets configurados em:
          # GitHub → Settings → Secrets and variables → Actions
          CATALOG_DOMAIN: ${{ secrets.CATALOG_DOMAIN }}
          CART_DOMAIN:    ${{ secrets.CART_DOMAIN }}
          SHELL_DOMAIN:   ${{ secrets.SHELL_DOMAIN }}
```

> **Como o `${{ secrets.NOME }}` funciona?**
> O GitHub substitui automaticamente pela valor real do secret antes de
> executar o step. O valor nunca aparece nos logs — se tentar fazer print
> de um secret, o GitHub o substitui por `***`.

> **O que é `matrix strategy`?**
> Em vez de criar 3 jobs idênticos (um por zona), o `matrix` cria um job
> parametrizado que roda em paralelo para cada valor da lista. O CI fica
> mais rápido e o código mais limpo.

> **O que é `npm ci`?**
> É o comando recomendado para CI. Diferente do `npm install`, ele não
> modifica o `package-lock.json`, falha se houver inconsistências e é
> mais rápido por usar o cache corretamente.

### 11.5 — Onde cada variável de ambiente fica

```
Variável        Onde fica                  Quando é usada
─────────────   ────────────────────────   ──────────────────────────
.env.local      Sua máquina (não commitado) npm run dev (local)
.env.example    Repositório (commitado)     Documentação para devs
Vercel panel    Painel da Vercel            npm run build (deploy)
GitHub Secrets  GitHub Actions             npm run build (CI)
```

Cada ambiente tem sua própria fonte de variáveis — nunca hardcoded no código.

### 11.6 — Adicionar scripts de lint e type-check nos projetos

Certifique-se que o `package.json` de cada zona tem esses scripts:

```json
{
  "scripts": {
    "dev":        "next dev --port 3000",
    "build":      "next build",
    "start":      "next start",
    "lint":       "next lint",
    "test":       "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  }
}
```

> Ajuste a porta em cada zona:
> - zone-shell:   `--port 3000`
> - zone-catalog: `--port 3001`
> - zone-cart:    `--port 3002`

### 11.7 — Proteger a branch main

Com o CI configurado, proteja a branch `main` para que nenhum código
com falha seja mergeado:

```
GitHub → Settings → Branches → Add rule

Branch name pattern: main

Marque:
☑ Require status checks to pass before merging
  → Adicione: "Quality Check — zone-shell"
  → Adicione: "Quality Check — zone-catalog"
  → Adicione: "Quality Check — zone-cart"
☑ Require branches to be up to date before merging
```

Agora nenhum Pull Request pode ser mergeado se o CI falhar.

### 11.8 — Commitar e testar o CI

> **Atenção:** só faça este commit depois de ter configurado os GitHub
> Secrets (seção 11.3). Sem os secrets, o step de build vai falhar.

```bash
git add .github/workflows/ci.yml
git commit -m "chore: adiciona workflow de CI com GitHub Actions"
git push
```

Acesse a aba **Actions** no seu repositório no GitHub para ver o
pipeline rodando em tempo real.

### 11.9 — Visualizando o resultado

Após o push, você verá algo assim na aba Actions:

```
✅ Quality Check — zone-shell    (passou em 45s)
✅ Quality Check — zone-catalog  (passou em 42s)
✅ Quality Check — zone-cart     (passou em 38s)
```

Se um teste falhar:

```
❌ Quality Check — zone-catalog
   └── Test
       └── ProductCard > renderiza o preço formatado — FALHOU
           Expected: "R$ 99.90"
           Received: "R$ 99.9"
```

O deploy na Vercel só acontece quando todos os checks passam.

### 11.10 — Fluxo completo com CI/CD

```
Você escreve código
       ↓
git push origin feature/minha-feature
       ↓
Abre Pull Request no GitHub
       ↓
GitHub Actions dispara o CI automaticamente
       ↓
  ┌─ CI passa ──────────────────────────────────────────────┐
  │  Merge liberado                                         │
  │  git merge → main                                       │
  │  Vercel detecta push na main                            │
  │  Deploy automático das 3 zonas                          │
  │  Preview URL disponível em segundos                     │
  └─────────────────────────────────────────────────────────┘
  ┌─ CI falha ──────────────────────────────────────────────┐
  │  Merge bloqueado                                        │
  │  Notificação no PR com o erro específico                │
  │  Nenhum deploy acontece                                 │
  └─────────────────────────────────────────────────────────┘
```

---

## Resumo das etapas

```
ETAPA 1:  Criar os 3 projetos Next.js
ETAPA 2:  Configurar zone-catalog (assetPrefix + páginas + testes)
ETAPA 3:  Configurar zone-cart (assetPrefix + carrinho + testes)
ETAPA 4:  Configurar zone-shell (rewrites + layout + home)
ETAPA 5:  Variáveis de ambiente (.env.local + .env.example)
ETAPA 6:  Rodar localmente (npm run dev na raiz)
ETAPA 7:  Testes (jest.config.js + testes por zona)
ETAPA 8:  Deploy inicial na Vercel (CLI) → anota URLs de produção
ETAPA 9:  Repositório no GitHub (.gitignore + commits + push)
ETAPA 10: Deploy automático (conectar GitHub na Vercel + Root Directory)
ETAPA 11: CI/CD (GitHub Secrets + GitHub Actions + proteger branch main)
```

> **Ordem importante entre etapas 8, 9 e 11:**
> O deploy (etapa 8) precisa vir antes do CI (etapa 11) porque os
> GitHub Secrets precisam das URLs reais de produção. Sem as URLs,
> não é possível configurar os secrets corretamente.
