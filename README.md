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

## Rodando localmente

```bash
pnpm install          # instala gov, obra e os pacotes compartilhados
pnpm dev:gov          # http://localhost:3000
pnpm dev:obra         # roda em paralelo numa porta diferente

cd apps/fiscal
npm start             # Expo Dev Tools — escaneie o QR no Expo Go
```

## Próximos passos

1. Provisionar um projeto Supabase real e rodar as migrations de
   `packages/database/supabase/migrations/` (hoje os dashboards usam dados
   de exemplo em `src/lib/mock-data.ts` / `src/data/mock.ts`).
2. Gerar os tipos do banco: `pnpm --filter @carbonfree/database gen:types`
   (requer `supabase link` com o projeto real).
3. Trocar os ícones placeholder de `apps/obra/public/manifest.webmanifest`
   e `apps/fiscal/assets/` pela identidade visual definitiva.
4. Autenticação (gov.br / ICP-Brasil para assinatura, e-mail+MFA para
   perfis administrativos) — hoje as telas não têm login.
