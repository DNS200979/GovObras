# CarbonFree Obras

Ecossistema de três produtos para fiscalização municipal de carbono de obra,
descrito em `carbonfree-obras-plano-de-negocio.html`: um gerenciador para a
prefeitura, um app para construtoras/profissionais independentes e um app
nativo offline-first para o fiscal de campo.

## Estrutura

```
apps/
  gov/      CarbonFree Gov    — Next.js (App Router), dashboard multi-tenant da prefeitura
  obra/     CarbonFree Obra   — Next.js (App Router) como PWA, uso da construtora
  fiscal/   CarbonFree Fiscal — Expo (React Native), offline-first, fora do workspace pnpm

packages/
  design-tokens/  paleta, tipografia e tema Tailwind compartilhados (Gov + Obra)
  ui/             design system compartilhado (AppShell, KpiTile, CarbonBalanceBar, TrendChart...)
  database/       schema Supabase (SQL + RLS) e cliente tipado
```

## Decisões de arquitetura

- **Backend**: Next.js full-stack (Server Actions / Route Handlers) direto no
  Supabase (Postgres + RLS), em vez do FastAPI separado sugerido no plano —
  prioriza velocidade de entrega do MVP num único pipeline Vercel. Workers
  Python podem entrar depois só para tarefas pesadas (parsing de XML em
  lote, integração SEFAZ), se necessário.
- **Fiscal**: Expo nativo desde o início (não PWA), porque os requisitos
  anti-fraude do plano (bloqueio de galeria, detecção de mock location,
  captura só in-app) dependem de APIs nativas.
- **`apps/fiscal` fica fora do workspace pnpm** — Metro (bundler do React
  Native) usa resolução própria e tem atrito conhecido com pnpm; o app usa
  npm isoladamente, mas continua no mesmo repositório git.

## Banco de dados

Supabase real provisionado via Vercel Marketplace (projeto `supabase-erin-leaf`,
time `dns200979s-projects`), conectado tanto a `carbonfree-gov` quanto a
`carbonfree-obra` — os dois apps compartilham o mesmo banco. Schema com 14
tabelas + RLS (`packages/database/supabase/migrations/`), advisor de
segurança do Supabase limpo, populado com dado de demonstração
relacionalmente íntegro (`packages/database/scripts/seed.mjs`).

Os dashboards de Gov e Obra já leem direto do banco real (`src/lib/
queries.ts` em cada app) via `@carbonfree/database/admin` — um cliente
service-role usado **temporariamente** porque ainda não há login; com RLS
ativo, um usuário anônimo não vê nenhuma linha (verificado). Quando a
autenticação existir, trocar essas leituras por `createServerSupabase()`
(RLS por sessão real). Todas as rotas com dado real são `force-dynamic`
(sem cache estático de build).

```bash
cd apps/gov  # ou apps/obra
vercel env pull .env.local --yes   # traz as credenciais reais do Supabase
```

## Rodando localmente

```bash
pnpm install          # instala gov, obra e os pacotes compartilhados
pnpm dev:gov          # http://localhost:3000
pnpm dev:obra         # roda em paralelo numa porta diferente

cd apps/fiscal
npm start             # Expo Dev Tools — escaneie o QR no Expo Go
```

## Próximos passos

1. Gerar os tipos do banco: requer Docker/Podman local (`supabase gen types
   --db-url ...`) ou `supabase login` + `supabase link --project-ref
   sidkrwbzbfkbjyqnurgp` seguido de `pnpm --filter @carbonfree/database
   gen:types` — nenhum dos dois disponível neste ambiente de execução.
2. Trocar os ícones placeholder de `apps/obra/public/manifest.webmanifest`
   e `apps/fiscal/assets/` pela identidade visual definitiva.
3. Autenticação (gov.br / ICP-Brasil para assinatura, e-mail+MFA para
   perfis administrativos) — hoje as telas usam o cliente admin (service
   role) porque não há sessão; ver nota em "Banco de dados" acima.
4. `apps/obra` hoje é fixo numa única obra de demonstração (`ALV-2025-1042`
   em `src/lib/queries.ts`) porque não há como saber "qual construtora
   está logada" sem autenticação — resolve junto com o item 3.
