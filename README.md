# CarbonFree Obras

Ecossistema de fiscalização municipal de carbono de obra, descrito em
`docs/carbonfree-obras-plano-de-negocio.html`: um gerenciador para a prefeitura,
um app para construtoras, um portal para as concreteiras que abastecem as obras
e um app nativo offline-first para o fiscal de campo.

## Estrutura

```
apps/
  gov/          CarbonFree Gov          — Next.js (App Router), painel multi-tenant da prefeitura
  obra/         MBV Construtoras        — Next.js (App Router) como PWA, uso da construtora
  concreteira/  MBV Concreteiras        — Next.js (App Router), portal do fornecedor de concreto
  fiscal/       CarbonFree Fiscal       — Expo (React Native), offline-first, fora do workspace pnpm

packages/
  design-tokens/  paleta, tipografia e tema Tailwind compartilhados
  ui/             design system artesanal usado por Obra e Concreteira
  database/       schema Supabase (SQL + RLS) e cliente tipado

docs/
  plano-revisao.md   plano de revisão técnica em fases (o que já foi feito e o que falta)
  mbv/               material do ecossistema MBV (Lei 15.042, selos verdes, 1 Hectare…)
  referencia/        documentos de referência (regras de negócio, matriz de financiamento)
```

`apps/gov` usa **shadcn/ui** (não o `packages/ui` compartilhado) — desktop-only por
decisão do produto, com os tokens de cor mapeados para a marca CarbonFree
(ardósia/verde/âmbar) em vez da paleta cinza padrão. `apps/obra` e
`apps/concreteira` usam o design system artesanal de `packages/ui`.

> Convergir esses dois sistemas é a Fase 3 de `docs/plano-revisao.md`. A direção
> decidida é crescer o `packages/ui` e migrar o Gov para ele.

## Decisões de arquitetura

- **Backend**: Next.js full-stack (Server Actions / Route Handlers) direto no
  Supabase (Postgres + RLS), em vez do FastAPI separado sugerido no plano —
  prioriza velocidade de entrega do MVP num único pipeline Vercel.
- **Fiscal**: Expo nativo desde o início (não PWA), porque os requisitos
  anti-fraude do plano (bloqueio de galeria, detecção de mock location,
  captura só in-app) dependem de APIs nativas.
- **`apps/fiscal` fica fora do workspace pnpm** — Metro (bundler do React
  Native) usa resolução própria e tem atrito conhecido com pnpm; o app usa
  npm isoladamente, mas continua no mesmo repositório git.

## Verificação

```bash
pnpm lint         # eslint nos 3 apps web
pnpm typecheck    # tsc --noEmit nos 3 apps web
pnpm test         # vitest — lógica pura (cálculo de carbono, XML, diagnóstico)
pnpm build        # build de produção dos 3
```

Os quatro rodam em cada PR via `.github/workflows/ci.yml`. O step de `build`
depende dos secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
e `SUPABASE_SERVICE_ROLE_KEY` cadastrados no repositório.

Os testes cobrem só **lógica pura, sem I/O** — o motor de diagnóstico de
financiamento, a geração do XML do SisobraPref e a conversão de unidade que
transforma entrega de concreto em lançamento de carbono. Testar Server Actions
e RLS exige Supabase local (Docker).

## Banco de dados

Supabase real provisionado via Vercel Marketplace (projeto `supabase-erin-leaf`,
time `dns200979s-projects`), compartilhado pelos três apps web. 30 migrations em
`packages/database/supabase/migrations/`, advisor de segurança limpo, populado
com dado de demonstração relacionalmente íntegro
(`packages/database/scripts/seed.mjs`).

**Extensões habilitadas**: `postgis` e `vector` no schema `extensions`, `pg_cron`
(o Supabase força ele pro `pg_catalog`, independente do `WITH SCHEMA` pedido na
migration). PostGIS já em uso em `obras.coordenadas`; `pg_cron` e `pgvector`
seguem só como infraestrutura, sem tarefa/embedding real ainda.

**`obras.coordenadas`** é `geography(Point,4326)` de verdade (migrado de `point`
puro), com índice GIST e colunas geradas `latitude`/`longitude` (`stored`,
calculadas via `st_y`/`st_x`) pra o app ler/escrever sem parsing de WKB — grava
mandando texto EWKT (`SRID=4326;POINT(lng lat)`), lê `latitude`/`longitude` como
número puro. `mudas.coordenadas` e `fiscalizacoes.coordenada_execucao` continuam
`point` puro — mesmo padrão de migration se/quando fizer sentido.

Os tipos TypeScript do schema **ainda não foram gerados**
(`pnpm --filter @carbonfree/database gen:types`): requer `supabase login` +
`link`, ou Docker local.

## Autenticação

Os três apps web usam **e-mail + senha** via Supabase Auth
(`signInWithPassword`) — trocado do magic link original porque o link do
Supabase entrega os tokens como fragmento da URL (`#access_token=...`), que
nunca chega ao servidor; em produção isso causava um loop de redirecionamento
rápido demais pra perceber. Senha evita o problema inteiramente, já que a sessão
nasce no mesmo request/response do Server Action.

`proxy.ts` (Next.js 16 — antigo `middleware.ts`; **tem que ficar dentro de
`src/`**, não na raiz do app, senão o Next ignora o arquivo silenciosamente)
protege todas as rotas privadas de cada app.

Cada app aceita só os seus papéis, checados contra o `check` da tabela `perfis`:

| App | Papéis aceitos |
| --- | --- |
| Gov | `prefeitura_gestor`, `prefeitura_analista` |
| Obra | `construtora_lancador`, `construtora_rt` |
| Concreteira | `concreteira` |

RLS cobre o fluxo inteiro: a prefeitura só enxerga obras/inventários/
fiscalizações do próprio `municipio_id`; a construtora só as suas obras; a
concreteira só as obras em que foi vinculada.

**Quatro pontos ainda usam o client de service role** para contornar policy
faltante — cada um com a checagem de posse feita em código antes do uso, e todos
documentados no próprio arquivo. Fechá-los é a Fase 4 de `docs/plano-revisao.md`.

Criar um novo usuário da prefeitura:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node packages/database/scripts/seed-prefeitura-user.mjs "email@prefeitura.gov.br" "senha" "Nome" [prefeitura_gestor|prefeitura_analista]
```

## Rodando localmente

```bash
pnpm install
vercel env pull apps/gov/.env.local --yes   # idem para obra e concreteira

pnpm dev:gov          # http://localhost:3000
pnpm dev:obra         # porta seguinte
pnpm dev:concreteira

cd apps/fiscal
npm start             # Expo Dev Tools — escaneie o QR no Expo Go
```

## Módulos

### Gov — prefeitura

- **Painel** (`/`) — KPIs, balanço de carbono municipal, distribuição por faixa
  do selo, série histórica de intensidade e mesa de análise.
- **Mapa** (`/mapa`) — limite municipal do IBGE, obras georreferenciadas e 14
  camadas WMS (CAR/SICAR, SIGSC-SC, geoportais de Florianópolis e Palhoça).
- **Obras** (`/obras`) — cadastro licenciado com intensidade, risco e local. A
  página de detalhe consulta cada camada territorial na coordenada exata e
  aponta conflito com área protegida e situação cadastral no ponto.
- **Construtoras** (`/construtoras`) e **Concreteiras** (`/concreteiras`) —
  cadeia de suprimento, com entregas declaradas e ESG publicado.
- **Agendamento** (`/agendamento`) — programação de vistorias.
- **Requisitos auditáveis** (`/requisitos`) — as 19 linhas das seções 5.1/5.2
  do plano (11 de passivo, 8 de ativo).
- **Projetos ESG** (`/esg`) — fila de projetos enviados pelas construtoras para
  instruir desconto fiscal.
- **SisobraPref** (`/obrigacoes`) — competência do mês, pendências por alvará,
  XML no leiaute v1.03 e protocolo. A assinatura XMLDSig e o envio SOAP ficam
  de fora de propósito: dependem do e-CNPJ do município e da adesão ao DTE.
- **Financiamento climático** (`/financiamento`) — diagnóstico de 20 questões
  (99 pontos), rota de captação por faixa e catálogo de 18 fontes.

### Obra — construtora

Painel de carbono, obras, concreteiras vinculadas, ESG (com guia passo a passo),
simulador de decisão de material e dossiê assinável.

### Concreteira — fornecedor

Obras vinculadas, entregas de concreto (volume, traço e composição por insumo,
com NF-e/CT-e anexada) e scorecard ESG publicável.

### Fiscal — campo

Login, abas de vistoria e sincronização, trabalho offline com fila.

## Próximos passos

O plano de revisão técnica em fases, com o que já foi executado e o que falta,
está em **`docs/plano-revisao.md`**.

Fora dele, do lado de produto:

1. Recebimento no Gov dos autos enviados pelo app Fiscal — hoje só o
   agendamento existe.
2. MFA obrigatório para perfis administrativos (citado no plano).
3. Trocar os ícones placeholder de `apps/obra/public/manifest.webmanifest` e
   `apps/fiscal/assets/` pela identidade visual definitiva.
4. Substituir os fatores de emissão ilustrativos de agregados e aditivos por
   DAP real do fornecedor antes de qualquer homologação valer.
