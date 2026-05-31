# appmeta

App metadata manager — gerencie metadados dos seus apps (iOS, Android, Web, Desktop)
em um só lugar.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **React Server Components** + Server Actions para o CRUD
- **Supabase** (Postgres) como banco de dados

## Features

- Autenticação com email + senha (Supabase Auth) e sessão por cookie via `@supabase/ssr`
- Cada usuário só vê e edita seus próprios apps (isolamento por RLS no Postgres)
- Dashboard com estatísticas (total de apps, publicados, drafts, plataformas)
- CRUD completo via UI e via API REST
- Metadata: nome, slug, descrição, versão, plataforma, status, categoria, tags,
  ícone e URL da loja
- Persistência em Postgres via Supabase, com `updated_at` automático e índices
  em `status`, `platform`, `updated_at` e `owner_id`
- Upload de ícones para Supabase Storage (bucket público `app-icons`), com policies
  que restringem upload/delete à pasta do próprio usuário

## Setup

1. Crie um `.env.local` baseado em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

2. Aplique as migrations (estão em `supabase/migrations/` no painel do Supabase MCP — schema: tabela `public.appmeta_apps`).

3. Rode:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (requer `NODE_ENV=production`) |
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
middleware.ts               # Refresh de sessão + redirect login/protegido

app/
├── layout.tsx              # Layout raiz + nav + logout
├── page.tsx                # Dashboard
├── globals.css             # Estilos globais
├── login/page.tsx          # Sign in
├── signup/page.tsx         # Sign up
├── auth/sign-out/route.ts  # POST → encerra sessão
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
├── supabase/
│   ├── server.ts           # createClient() para RSC / Actions / Routes
│   └── middleware.ts       # updateSession() para middleware.ts
├── store.ts                # Repositório de apps (Supabase, escopado ao user)
├── icons.ts                # uploadIcon() / deleteIcon() para o bucket app-icons
└── types.ts                # Tipos compartilhados
```

## Banco de dados

Tabela: `public.appmeta_apps`

| Coluna | Tipo | Default |
|---|---|---|
| `id` | uuid | `gen_random_uuid()` |
| `name` | text | — |
| `slug` | text (unique) | — |
| `description` | text | `''` |
| `version` | text | `'0.1.0'` |
| `platform` | text | check: `ios\|android\|web\|desktop` |
| `status` | text | check: `draft\|published\|archived` |
| `category` | text | `'Uncategorized'` |
| `tags` | text[] | `{}` |
| `icon_url` | text | nullable |
| `store_url` | text | nullable |
| `created_at` | timestamptz | `now()` |
| `updated_at` | timestamptz | `now()` (auto-bump via trigger) |
| `owner_id` | uuid → `auth.users(id)` | obrigatório, set automaticamente no insert |

RLS habilitado. Policies: `for all to authenticated using (auth.uid() = owner_id)`.
`anon` não tem nenhum acesso à tabela.

## Storage

Bucket: `app-icons` (público, max 2 MB, MIME: png/jpeg/webp/svg).
Path: `app-icons/{user_id}/{uuid}.{ext}`.
RLS no `storage.objects`: leitura pública, mas só o dono pode inserir/atualizar/deletar
arquivos dentro da sua pasta `{user_id}/`.

## Próximos passos

- Integração com App Store Connect e Google Play Console
- Login social (Google / GitHub) e magic link
- Filtros e busca na listagem
- Histórico de versões
