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
  ui/             design system compartilhado com Obra (AppShell, KpiTile, CarbonBalanceBar, TrendChart...)
  database/       schema Supabase (SQL + RLS) e cliente tipado
```

`apps/gov` usa **shadcn/ui** (não o `packages/ui` compartilhado) — desktop-only por
decisão do produto, com os tokens de cor mapeados para a marca CarbonFree
(ardósia/verde/âmbar) em vez da paleta cinza padrão. `apps/obra` continua no
design system artesanal de `packages/ui`.

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

**Gov** já tem autenticação real (ver seção abaixo) e lê tudo via
`createServerSupabase()` — RLS por sessão de verdade, não bypass. **Obra**
ainda usa `@carbonfree/database/admin` (service role) temporariamente,
porque não tem login ainda — mesmo padrão que o Gov tinha antes. Todas as
rotas com dado real são `force-dynamic` (sem cache estático de build).

## Autenticação (Gov)

Login por **magic link** (sem senha) via Supabase Auth — `shouldCreateUser:
false`, então só e-mails com `perfis` pré-cadastrado conseguem entrar
(fechado, não é signup público). Fluxo: `/login` → e-mail → link → `/auth/
confirm` (Route Handler que troca o token por sessão) → cookies via
`proxy.ts` (Next.js 16 — antigo `middleware.ts`; **tem que ficar dentro de
`src/`**, não na raiz do app, senão o Next ignora o arquivo silenciosamente).

RLS cobre o fluxo inteiro: `prefeitura_gestor`/`prefeitura_analista` só
enxergam obras/inventários/fiscalizações do próprio `municipio_id`; a
policy de `perfis` que lista fiscais para o select do agendamento é
escopada do mesmo jeito. Testado de ponta a ponta (magic link real gerado
via admin API → sessão estabelecida → dashboard com dado escopado).

Criar um novo usuário da prefeitura:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node packages/database/scripts/seed-prefeitura-user.mjs "email@prefeitura.gov.br" "Nome"
```

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

## Módulos do Gov

- **Painel** (`/`) — KPIs, balanço de carbono municipal, distribuição por
  faixa do selo, série histórica de intensidade e mesa de análise.
- **Obras** (`/obras`) — cadastro licenciado com intensidade e risco.
- **Agendamento** (`/agendamento`) — módulo real de programação de
  vistorias (seção 06 do plano): calendário, criação de vistoria com
  obra/fiscal/data via Server Action, gravando em `fiscalizacoes`.
- **Requisitos auditáveis** (`/requisitos`) — catálogo das 19 linhas reais
  das seções 5.1/5.2 do plano (o que é passivo, o que é ativo, evidência
  primária e teste de verificação de cada um), na tabela
  `requisitos_auditoria` (`packages/database/scripts/seed-requisitos.mjs`).

## Próximos passos

1. Gerar os tipos do banco: requer Docker/Podman local (`supabase gen types
   --db-url ...`) ou `supabase login` + `supabase link --project-ref
   sidkrwbzbfkbjyqnurgp` seguido de `pnpm --filter @carbonfree/database
   gen:types` — nenhum dos dois disponível neste ambiente de execução.
2. Trocar os ícones placeholder de `apps/obra/public/manifest.webmanifest`
   e `apps/fiscal/assets/` pela identidade visual definitiva.
3. Levar a mesma autenticação pro **Obra** — hoje é fixo numa única obra
   de demonstração (`ALV-2025-1042` em `src/lib/queries.ts`) porque não há
   como saber "qual construtora está logada" sem sessão real.
4. MFA obrigatório para perfis administrativos (citado no plano) — o login
   atual é só magic link, sem segundo fator.
5. Módulo de fiscalização de campo (autos, sanção, TAC) ainda não tem tela
   própria no Gov — hoje só o agendamento existe; recebimento dos autos
   enviados pelo app Fiscal é o próximo passo natural.
6. Advisor do Supabase aponta ~25 warnings de performance (não segurança)
   nas policies de RLS — `auth.<fn>()` deveria virar `(select auth.<fn>())`
   e algumas tabelas têm policies permissivas duplicadas pra consolidar.
   Não afeta corretude, só escala mal com muitas linhas; não é urgente
   com o volume de dado atual.
