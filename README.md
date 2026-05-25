# MFE Multi-Zones — Projeto de Estudos

Projeto de estudos sobre Micro-frontends usando **Next.js Multi-Zones**, a abordagem oficial da Vercel para micro-frontends.

## O que é Multi-Zones

Multi-Zones divide uma aplicação grande em apps Next.js menores, cada uma responsável por um conjunto de rotas. O usuário acessa sempre o mesmo domínio e não percebe que são apps separadas.

## Arquitetura

```
mfe-multizones/
├── zone-shell/     → porta 3000 — home, header global, proxy (orquestrador)
├── zone-catalog/   → porta 3001 — /products e /products/[id]
└── zone-cart/      → porta 3002 — /cart
```

```
localhost:3000/           → zone-shell   (home, layout global)
localhost:3000/products   → zone-catalog (catálogo — proxy transparente)
localhost:3000/cart       → zone-cart    (carrinho — proxy transparente)
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

## Por que `assetPrefix`

Em produção, todas as zonas são servidas pelo mesmo domínio. Sem o prefixo, `/_next/static/chunks/main.js` do zone-catalog sobrescreveria o do zone-shell. O prefixo `/catalog-static` garante assets únicos por zona.

## Por que `<a>` em vez de `<Link>` entre zonas

O `<Link>` do Next.js tenta fazer prefetch e soft navigation, que não funciona entre zonas e causa erros silenciosos. Use `<a>` para links entre zonas e `<Link>` apenas dentro da mesma zona.

## Multi-Zones vs Module Federation

| | Multi-Zones | Module Federation |
|---|---|---|
| Granularidade | Rota a rota | Componente a componente |
| Mecanismo | Proxy no servidor | Runtime no browser |
| SSR | Nativo por zona | Complexo |
| Configuração | Zero extra | Plugin externo (Webpack) |

**Use Multi-Zones** quando a divisão é por domínio de negócio/rota.  
**Use Module Federation** quando precisa compartilhar componentes entre apps.

## Deploy na Vercel

Cada zona é um projeto separado com deploy independente.

```
1. Deploy zone-catalog → anota URL
2. Deploy zone-cart    → anota URL
3. Configura variáveis em zone-shell (Settings → Environment Variables)
4. Deploy zone-shell   → aplicação completa
```

Conecte o GitHub para deploy automático: Settings → Git → Root Directory = `zone-catalog` (repetir para cada zona).
