# appmeta

App metadata manager — gerencie metadados dos seus apps (iOS, Android, Web, Desktop)
em um só lugar.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **React Server Components** + Server Actions para o CRUD
- Storage em memória (substituível por DB real — Postgres, Supabase, SQLite, etc.)

## Features

- Dashboard com estatísticas (total de apps, publicados, drafts, plataformas)
- CRUD completo de apps via UI e via API REST
- Metadata: nome, slug, descrição, versão, plataforma, status, categoria, tags,
  ícone e URL da loja

## Começando

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | Lint com ESLint |
| `npm run typecheck` | Verifica tipos sem emitir |

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/apps` | Lista todos os apps |
| `POST` | `/api/apps` | Cria um app |
| `GET` | `/api/apps/:id` | Detalha um app |
| `PATCH` | `/api/apps/:id` | Atualiza parcialmente |
| `DELETE` | `/api/apps/:id` | Remove um app |

Exemplo:

```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","platform":"ios","status":"draft"}'
```

## Estrutura

```
app/
├── layout.tsx              # Layout raiz + nav
├── page.tsx                # Dashboard
├── globals.css             # Estilos globais
├── apps/
│   ├── page.tsx            # Listagem
│   ├── new/page.tsx        # Form de criação
│   └── [id]/
│       ├── page.tsx        # Detalhe / edição
│       └── not-found.tsx
└── api/apps/
    ├── route.ts            # GET / POST
    └── [id]/route.ts       # GET / PATCH / DELETE

lib/
├── store.ts                # In-memory store (substitua por DB real)
└── types.ts                # Tipos compartilhados
```

## Próximos passos

- Trocar o `lib/store.ts` por um banco real (Supabase, Postgres, etc.)
- Adicionar autenticação
- Upload de ícones
- Integração com App Store Connect e Google Play Console
