# Plano de revisão — CarbonFree

Levantado em 24/08/2026 sobre `main` @ `9093da5`.
Marque `[x]` conforme for executando.

## Diagnóstico

O que foi medido, não estimado:

| Verificação | Resultado |
| --- | --- |
| `tsc --noEmit` nos 3 apps web | limpo |
| `eslint` | 6 erros, em 4 arquivos |
| Testes automatizados | **0** |
| CI | **inexistente** |
| `TODO` / `FIXME` / `HACK` | nenhum |
| Segredos versionados | nenhum |
| `console.*` esquecidos | 2 |
| Hardcodes de demonstração | nenhum |

O código está limpo. O risco não está na qualidade do que foi escrito — está
na **ausência de rede de segurança** e na **duplicação entre `obra` e
`concreteira`**, que dobra o custo de cada correção daqui pra frente.

---

## Fase 0 — Rede de segurança ✅ concluída em 24/08/2026

Sem isto, toda refatoração seguinte é às cegas. É a única fase que bloqueia as outras.

- [x] **`pnpm typecheck` não verifica nada hoje.** O `turbo.json` declara a task,
      mas nenhum app define o script — o comando passa vazio e dá falsa confiança.
      Adicionar `"typecheck": "tsc --noEmit"` em `apps/gov`, `apps/obra` e
      `apps/concreteira`.
- [x] **CI no GitHub Actions** rodando `lint` + `typecheck` + `build` em cada PR.
- [x] **Primeiros testes** — 54 testes, verificados por mutação, nos pontos de cálculo puro:
  - `apps/gov/src/lib/financiamento.ts` → `calcularDiagnostico`, faixas e a regra
    de resposta parcial valendo metade do peso.
  - `apps/gov/src/lib/sisobrapref.ts` → campos obrigatórios do leiaute, limite de
    50 alvarás por lote, teto de 500 KB.
  - `apps/obra/src/app/concreteiras/actions.ts` → a conversão de unidade da
    materialização (`kgCO2e` → `t`, recusa quando a unidade não bate). É onde um
    erro silencioso produziria número errado no inventário.

## Fase 1 — Limpeza rápida ✅ concluída em 25/08/2026

Baixo risco, ganho imediato de legibilidade. Pode ir junto com a Fase 0.

- [x] Corrigir os 6 erros de lint — nenhum foi silenciado; cada um virou refatoração:
  - `use-mobile.ts` → `useSyncExternalStore` no lugar de espelhar o viewport em state.
  - `theme-toggle.tsx` (obra + concreteira) → o DOM voltou a ser a única fonte de
    verdade do tema, observado por `MutationObserver`. Some o state duplicado e o
    ícone passa a seguir a classe `dark` mesmo se outra coisa a mudar.
  - `obrigacoes/page.tsx` → a leitura do relógio saiu do componente e foi para a
    camada de dados; a matemática virou `diasAteOPrazo()`, pura e testada.
  - `nova-form.tsx` → aspas tipográficas no lugar das retas não escapadas.
- [x] **README reescrito.** Passou a descrever os quatro apps (faltava o
      `concreteira`), os 10 módulos do Gov, a seção de verificação, a tabela de
      papéis por app e os pontos de service role. Os itens já concluídos saíram
      de "Próximos passos".
- [x] **Raiz limpa.** Os 9 HTMLs foram para `docs/mbv/` e os binários para
      `docs/referencia/`, com os nomes preservados e histórico via `git mv`.
      Sobrou na raiz só configuração de projeto.

      **Achado a decidir:** `index01.html` e `indexv01.html` são byte-idênticos
      (mesmo md5), e `ERP_15042.html` é quase-cópia dos dois — mesmo título,
      1 byte de diferença. Não apaguei nada; vale escolher qual fica.
- [x] ~~Remover os 2 `console.*`~~ — **item errado, revisado.** Os dois
      `console.error` em `apps/gov/src/lib/geo-consulta.ts` foram adicionados de
      propósito pelo commit `47e5069` ("Loga erro real da consulta territorial").
      São observabilidade de servidor para geoportais municipais instáveis e vão
      para o log da Vercel. Ficam.

## Fase 2 — Unificar `obra` e `concreteira` ✅ concluída em 25/08/2026

Os dois apps são quase clones. Medido:

| Arquivo | Situação |
| --- | --- |
| `components/theme-toggle.tsx` | **byte-idêntico** (49 linhas) |
| `components/header-actions.tsx` | **byte-idêntico** (12 linhas) |
| `components/header-user.tsx` | difere só no nome da sessão |
| `components/*-shell.tsx` | difere só em nome do produto e nav |
| `lib/sessao.ts` | difere só na tabela e nos papéis aceitos |

Consequência prática: o bug de lint do `theme-toggle` precisa ser corrigido em
**dois arquivos** hoje.

- [x] `theme-toggle` movido para `packages/ui` — uma cópia no lugar de duas.
- [x] `header-actions` virou casca em `packages/ui` com o bloco de conta como
      slot; sumiu dos dois apps, ligada direto na casca de cada um.
- [x] `header-user` virou componente puramente visual em `packages/ui`; cada app
      mantém só o wrapper de 10 linhas que resolve a sua sessão. Era 24 linhas
      cada, com marcação duplicada.
- [x] `sessao.ts` passou a usar `lerSessaoDeOrganizacao` de
      `@carbonfree/database/sessao`. Os nomes de domínio (`construtoraId`,
      `concreteiraId`) foram **mantidos** de propósito: normalizá-los para
      `organizacaoId` mexeria em 17 call sites e pioraria a leitura. 55/54
      linhas viraram 37 cada, sendo a maior parte o mapeamento explícito.
- [x] A casca por app continua separada — `AppShell` já recebe nome, tag e nav
      por prop, então o que sobrou (~30 linhas) é configuração, não lógica.

**Duplicação idêntica restante:** só `lib/auth-actions.ts` (10 linhas). É uma
Server Action (`"use server"` + `redirect`); movê-la para um pacote compartilhado
exige configuração de transpilação e traz mais risco que as 10 linhas economizam.
Fica.

## Fase 3 — Convergir o design system  ·  tokens concluídos, componentes pendentes

**Decisão tomada:** crescer o `packages/ui` e migrar o Gov para ele.

Hoje existem três sistemas convivendo:

- `apps/gov` → shadcn/ui, 27 componentes
- `apps/obra` + `apps/concreteira` → `packages/ui`, 6 componentes
- `packages/design-tokens` → a marca em TS, consumida só em parte

A identidade visual vive em três lugares que podem divergir: os tokens em TS, as
CSS vars do shadcn no Gov, e o HTML do plano de negócio.

- [x] Alvo decidido: crescer o `packages/ui`, migrar o Gov.
- [x] **Paleta escura compartilhada.** `obra/globals.css` e
      `concreteira/globals.css` diferiam **só num comentário** — as 13 cores do
      `.dark` estavam duplicadas literalmente. Viraram
      `@carbonfree/design-tokens/dark.css`, importado por ambos. O import é
      opcional de propósito: quem quiser um escuro próprio não importa, ou
      sobrescreve depois — preserva a liberdade que a duplicação dava.

      Verificado no CSS gerado que a cascata não mudou: o `:root` claro sai
      dentro de `@layer` e o `.dark` sai fora de qualquer layer, então continua
      vencendo.
- [x] **`tailwind-preset.ts` removido** — 45 linhas de código morto. Era um
      preset JS (mecanismo do Tailwind v3); o projeto usa `@theme` no CSS do
      v4, e nenhum app o importava.
- [x] **Afordância das linhas de tabela** corrigida em `/concreteiras` e `/esg`
      (os outros 2 `cursor-pointer` eram `<label>` e `input[type=range]`,
      legítimos). O link agora se estica sobre a linha via `::after`: a área
      clicável passa a bater com o realce de hover, sem `onClick` em `<tr>` e
      sem tirar o foco de teclado do link real.

### Pendente — a migração dos componentes

O grosso da Fase 3 continua aberto: mover os 27 componentes shadcn de
`apps/gov/src/components/ui/` para o `packages/ui` e convergir os dois
mecanismos de tema.

**O obstáculo real** não é mover arquivo, é que os dois sistemas se tematizam
de formas diferentes:

- Gov usa tokens semânticos do shadcn (`--primary`, `--muted-foreground`),
  mapeados para a marca em `gov/globals.css`.
- `packages/ui` usa os tokens de marca direto (`text-texto`, `bg-concreto`).

Fazer o Gov consumir a paleta escura compartilhada é quase mecânico, mas **dois
valores divergem de fato** e mudariam a aparência:

| Token do Gov (dark) | Valor atual | Equivalente compartilhado |
| --- | --- | --- |
| `--muted-foreground` | `#8A9995` | `--color-texto-fraco` = `#93a5a0` |
| `--border` | `color-mix(… 10%, transparent)` | `--color-linha` = `#26383f` |

Não é refatoração, é decisão visual — deixei para você olhar antes.

- [ ] Alinhar (ou não) esses dois valores do dark do Gov.
- [ ] Mover os 27 componentes shadcn para `packages/ui`, começando pelos que
      Obra e Concreteira também usariam (`badge`, `card`, `table`, `button`).
- [ ] `sidebar.tsx` (723 linhas), `chart.tsx` e `command.tsx` por último — são
      os que mais dependem de `@base-ui/react` e `cmdk`.

## Fase 4 — Banco e segurança  ·  migration aplicada, service role zerado

### Como o banco foi alcançado

O MCP do Supabase desta sessão não enxerga o projeto dos apps
(`sidkrwbzbfkbjyqnurgp`), e o `supabase login` não roda em ambiente sem TTY.
O caminho que funcionou foi o `POSTGRES_URL_NON_POOLING` que o
`vercel env pull` já tinha deixado em `apps/gov/.env.local`, com o cliente `pg`.

Nota para quem repetir: o `pg` novo lê `sslmode` da própria string de conexão e
ignora o objeto `ssl`. Como o certificado do pooler é auto-assinado na ponta, é
preciso remover `sslmode=...` da URL e passar `ssl: { rejectUnauthorized: false }`.

- [x] **Tipos do banco gerados** (1753 linhas em `packages/database/src/types.ts`).
      O `--db-url` funcionou com o Docker local; não precisou de login.
      `Database` era `any` — trocar por tipos reais revelou **3 erros que o
      `any` escondia**, todos corrigidos:
      - `requisitos_auditoria.natureza` é `text` no banco, mas as interfaces
        esperavam `"passivo" | "ativo"`. A união **é** garantida por
        `check (natureza in (...))`, então virou um `comoNatureza()` explícito e
        documentado em vez de cast invisível (Gov e Obra).
      - `municipios.faixa_regua` é `jsonb` **sem constraint de forma**. Aqui o
        cast era suposição de verdade: um item malformado faria o `sort`
        comparar `NaN` e embaralhar a régua de incentivo em silêncio. Virou um
        guard `ehFaixaRegua()` que descarta entrada malformada.
### As 4 lacunas de service role

**Uma delas não era lacuna.** `alternativas_material` já tem
`for select to authenticated using (true)` desde a migration 3 (endurecida na
5) — o `createAdminClient()` ali era simplesmente desnecessário.

- [x] `apps/obra/src/lib/queries.ts` — trocado por `createServerSupabase()`,
      sem migration nenhuma. O import de `admin` ficou órfão e saiu junto.

As outras três são reais: `lancamentos` e `evidencias` tinham **só policy de
SELECT**, sem INSERT.

- [x] Migration escrita: `00000000000031_fecha_lacunas_service_role.sql`
  - `buscar_concreteira_por_cnpj(text)` — função `security definer` que devolve
    só o id, e só para papéis de construtora.
  - policy de INSERT em `lancamentos` — exige ser `construtora_rt`, o inventário
    ser de obra da própria construtora e estar em `rascunho`/`em_analise`. Sem
    UPDATE nem DELETE: lançamento é imutável.
  - policy de INSERT em `evidencias` — concreteira só na obra em que está
    vinculada, reusando `concreteira_vinculada_na_obra`.
- [x] **Migration aplicada** em 25/08/2026, dentro de transação, no projeto
      `sidkrwbzbfkbjyqnurgp`. Estado pré-aplicação conferido (nenhuma policy de
      INSERT existia, função ausente, 4 helpers presentes) e pós-aplicação
      verificado: as duas policies entraram como `INSERT` para `authenticated`,
      a função nasceu `security definer` com `search_path=public`, e
      `lancamentos` continua sem `UPDATE`/`DELETE`.
- [x] Os três `createAdminClient()` restantes foram trocados:
  - `apps/obra/src/app/concreteiras/actions.ts` → `db.rpc("buscar_concreteira_por_cnpj")`
  - `apps/obra/src/app/concreteiras/actions.ts` → `db.from("lancamentos").insert(...)`
  - `apps/concreteira/src/app/entregas/actions.ts` → `db.from("evidencias").insert(...)`

  Nada está commitado, então não há risco de deploy adiantado — mas a ordem
  importa: **migration primeiro, push depois**.

### Consequência: o service role saiu do runtime

Nenhum código de app importa mais `@carbonfree/database/admin`. Com isso:

- [ ] `packages/database/src/admin.ts` ficou **órfão**. Não apaguei — é decisão
      sua se vale manter como escotilha de emergência ou remover a arma
      carregada.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **não é mais necessária no runtime** dos três
      apps na Vercel. Continua sendo usada só pelos scripts de seed locais (que
      criam o próprio client) e pelo step de build do CI. Removê-la do ambiente
      de runtime na Vercel reduz o estrago de um vazamento de env.
### Achado novo: `anon` executa todas as funções `security definer`

As **10** funções `security definer` do schema são executáveis pelo papel `anon`
— inclusive `is_admin`, `current_papel` e as de vínculo. É o default do Supabase
para funções no schema `public`; `revoke ... from public` não remove esse grant.
Não foi introduzido pela migration 31, é padrão em todo o schema.

**Não é explorável hoje**, e isso foi testado de verdade: chamando
`buscar_concreteira_por_cnpj` pela REST API com a chave `anon` e um CNPJ que
existe no banco, a resposta é `null`. Todas as funções derivam de `auth.uid()`,
que é nulo para anônimo, então retornam nulo/falso.

**Não revoguei de propósito.** Policies são avaliadas com o papel de quem
consulta: se `anon` perder o `EXECUTE`, qualquer consulta anônima a uma tabela
cuja policy chame esses helpers passa a dar **erro de permissão** em vez de
simplesmente não retornar linha — o que pode quebrar a tela de login e qualquer
rota pública. Fazer isso exige mapear antes o que o papel anônimo acessa.

- [ ] Mapear as rotas anônimas e, se der, revogar `EXECUTE` de `anon` nas 10
      funções.

### Advisor rodado contra o banco vivo (25/08/2026)

Segurança: **zero achados.** Nenhuma tabela sem RLS, nenhuma com RLS e sem
policy, nenhuma função `security definer` sem `search_path` fixo.

Performance, medido (não mais estimado a partir das migrations):

| Achado | Qtd |
| --- | --- |
| `auth_rls_initplan` — policy chama `auth.*()` sem `(select ...)` | **11** |
| `multiple_permissive_policies` — mesma tabela+ação com várias permissivas | **19** |
| FK sem índice de cobertura | **28** |

São 11, não ~18: minha estimativa pelas migrations contava ocorrências dentro de
corpos de função e em policies já substituídas por migrations posteriores. Medir
no banco corrigiu o número.

**O achado de maior impacto está nos índices, não nas policies:**
`perfis.municipio_id`, `perfis.construtora_id` e `perfis.concreteira_id` **não
têm índice** — e são exatamente as colunas que `current_municipio_id()`,
`current_construtora_id()` e `current_concreteira_id()` consultam. Ou seja: toda
checagem de RLS do sistema inteiro passa por uma varredura nessas colunas.
Três índices resolvem, e é mudança aditiva, sem risco de alterar acesso.

- [x] **Índice nas 3 FKs de `perfis`** — migration 32, aplicada e verificada.
      FKs sem índice: 28 → 25. Mudança aditiva, não altera nenhuma policy.
- [ ] Criar índice nas outras 25 FKs.
- [ ] Reescrever as 11 policies com `(select auth.uid())`.
- [ ] Consolidar as 19 policies permissivas duplicadas.

      As duas últimas continuam merecendo PR próprio: são drop + recreate de
      controle de acesso, onde um erro de transcrição abre dado ou quebra acesso
      em silêncio. Os índices não têm esse risco.

## Fase 5 — Estrutura do código

- [ ] `apps/gov/src/lib/queries.ts` tem **938 linhas** cobrindo os 10 módulos.
      Quebrar por domínio (obras, financiamento, sisobrapref, esg, concreteiras).
- [ ] `apps/obra/src/lib/queries.ts` (746 linhas) pelo mesmo motivo.

---

## Decisões pendentes

1. **Alvo do design system (Fase 3).** Três caminhos:
   - Migrar `obra` e `concreteira` para shadcn — unifica em 27 componentes maduros,
     mas descarta o design artesanal do `packages/ui` e é a fase mais cara.
   - Manter os dois e fazer só os tokens convergirem — mais barato, aceita a
     divergência visual entre o app da prefeitura e os das empresas.
   - Crescer o `packages/ui` e migrar o Gov para ele — mais caro ainda, e o Gov já
     depende de componentes do shadcn sem equivalente (sidebar, command, chart).

   O README registra que o Gov usar shadcn foi decisão de produto (desktop-only).
   Se essa decisão continua valendo, o segundo caminho é o coerente.

2. **Escopo dos testes.** A Fase 0 propõe cobrir só cálculo puro. Testar Server
   Actions e RLS exige subir Supabase local (Docker), que hoje não está disponível
   neste ambiente.
