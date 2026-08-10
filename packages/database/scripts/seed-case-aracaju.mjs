/**
 * Case de referência: Aracaju Cidade do Futuro.
 *
 * Carrega, como projeto de captação, uma operação de crédito externo que
 * existiu de verdade — para a prefeitura ver o módulo com conteúdo real em vez
 * de dado inventado.
 *
 * O QUE É FATO, com fonte:
 *   - US$ 84 milhões do New Development Bank (banco dos BRICS), com a União
 *     como garantidora, contrato assinado em 19/10/2023 em Marraqueche.
 *   - Avaliação técnica na COFIEX em 2021; CAE do Senado aprovou em
 *     15/08/2023 (MSF 52/2023).
 *   - Componentes: drenagem e esgotamento, recuperação e construção de canais,
 *     dragagem do rio Poxim, pavimentação de avenidas.
 *   - Metas do programa: −22% de pontos de alagamento, −30% de áreas de
 *     inundação, +5% de rede de esgoto, ~40 km de vias recuperadas.
 *   - Em 2021–22 Aracaju tinha relatório de emissões de GEE elaborado e o
 *     Plano Municipal de Adaptação às Mudanças Climáticas entre as frentes
 *     estratégicas — em elaboração, não aprovado.
 *
 * O QUE É RECONSTRUÇÃO:
 *   As 20 respostas do diagnóstico e a situação dos 25 documentos retratam
 *   como o projeto plausivelmente estava em 2021, antes de ir à COFIEX. Não
 *   temos acesso ao dossiê interno da prefeitura de Aracaju: cada resposta traz
 *   na evidência a base que a sustenta, e onde a base é inferência isso está
 *   escrito. Ninguém deve ler isto como auditoria do que Aracaju fez.
 *
 * O projeto entra no município da instância (Florianópolis) porque as
 * políticas de RLS enxergam pelo município do perfil; o nome carrega o prefixo
 * CASE para não se confundir com um projeto real da prefeitura.
 *
 * Uso: node packages/database/scripts/seed-case-aracaju.mjs
 */

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../../apps/gov/.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const NOME = "[CASE] Aracaju Cidade do Futuro — drenagem e saneamento";

const DESCRICAO = `Operação real de crédito externo, carregada como case de referência.

O programa reúne mais de 20 obras estruturantes de drenagem, esgotamento, recuperação de canais e pavimentação, com metas de reduzir em 22% os pontos de alagamento e em 30% as áreas de inundação, ampliar em 5% a rede de esgoto e recuperar cerca de 40 km de vias. Foi financiado com US$ 84 milhões do New Development Bank, com a União como garantidora — contrato assinado em 19/10/2023, após avaliação na COFIEX em 2021 e aprovação do Senado em 15/08/2023 (MSF 52/2023).

O diagnóstico abaixo reconstrói como o projeto estava em 2021, ANTES de ir à COFIEX. A operação e os números são fato, com fonte; as respostas do diagnóstico são reconstrução para demonstração — não temos o dossiê interno da prefeitura de Aracaju.`;

/** [questaoId, resposta, evidência] — reconstrução de 2021, pré-COFIEX. */
const RESPOSTAS = [
  [1, "parcial", "O programa tinha coordenação na prefeitura, mas uma UGP formal com equipe dedicada e regimento é exigência que se consolida no rito do financiador. Inferência."],
  [2, "parcial", "O Plano Municipal de Adaptação às Mudanças Climáticas estava entre as frentes estratégicas da Sema no período, em elaboração — não aprovado. Fonte: Prefeitura de Aracaju."],
  [3, "parcial", "Havia relatório de emissões de GEE elaborado como base para o plano de enfrentamento, e o inventário entrou nas propostas da revisão do Plano Diretor. Não equivale a inventário completo no padrão GPC. Fonte: Prefeitura de Aracaju."],
  [4, "parcial", "Aracaju tem histórico documentado de alagamentos e o programa nasce dele, mas mapa formal de ameaça, exposição e vulnerabilidade é outro produto. Inferência."],
  [5, "sim", "Programa anunciado como o maior de investimentos da história do município, com obras definidas e vínculo orçamentário — condição para a carta consulta à COFIEX."],
  [6, "sim", "Problema (alagamento), solução (macrodrenagem, canais, dragagem do Poxim), beneficiários e mais de 20 componentes definidos."],
  [7, "parcial", "As metas físicas existiam (−22% de pontos de alagamento, −30% de áreas de inundação), mas expressas como desempenho de drenagem, não como adicionalidade climática quantificada no formato que fundos climáticos pedem."],
  [8, "sim", "Orçamento na ordem de US$ 105 milhões (US$ 84 mi financiados + contrapartida), montante que a carta consulta à COFIEX exige fechado."],
  [9, "parcial", "Estudos de concepção existiam para sustentar a carta consulta; a viabilidade técnico-econômica no padrão do banco é etapa posterior. Inferência."],
  [10, "parcial", "Obras em canais e dragagem de rio exigem licenciamento ambiental, provavelmente mapeado; salvaguardas no padrão do financiador são exigência do banco, não do rito nacional. Inferência."],
  [11, "parcial", "Intervenção em canais e vias existentes envolve faixas de domínio e possíveis desapropriações. Diagnóstico fundiário completo é inferência."],
  [12, "parcial", "Programa de alto impacto urbano em bairros consolidados. Consulta formalizada com atas e mecanismo de queixas é exigência do banco. Inferência."],
  [13, "nao", "Plano de gênero e inclusão com indicadores desagregados não era prática corrente em programas municipais de infraestrutura no período. Inferência."],
  [14, "parcial", "Metas mensuráveis definidas, mas sem linha de base publicada, fontes de verificação e frequência de aferição — o que caracteriza uma matriz de resultados com MRV."],
  [15, "sim", "Capacidade de pagamento e margem de endividamento são pré-condição para a COFIEX e para a garantia da União, que veio a ser concedida."],
  [16, "sim", "Contrapartida municipal prevista na estrutura da operação, ao lado dos US$ 84 milhões financiados."],
  [17, "parcial", "Drenagem e canais exigem manutenção continuada; plano de O&M com custeio e responsável definido costuma ser cobrado pelo banco na negociação. Inferência."],
  [18, "parcial", "A execução exigiria unidade de gerenciamento; a formalização com equipe dedicada acompanha a assinatura do contrato. Inferência."],
  [19, "nao", "Regras de aquisição do NDB diferem da Lei de Licitações e a capacitação da equipe é etapa do rito, posterior a 2021. Inferência."],
  [20, "sim", "Diálogo com o financiador em curso — a avaliação técnica na COFIEX em 2021 pressupõe interlocução estabelecida com o banco."],
];

/**
 * [documentoId, situação, observação] na rota de crédito externo, em 2021.
 * Pronto = o rito já exigiu e a prefeitura tinha; em elaboração = estava
 * sendo produzido; pendente = viria depois.
 */
const DOCUMENTOS = [
  [1, "pronto", "Carta consulta à COFIEX pressupõe manifestação formal do município."],
  [2, "pendente", "Lei autorizativa é etapa do rito, anterior à aprovação do Senado em 2023."],
  [3, "pronto", "Programa incluído no orçamento como condição da carta consulta."],
  [4, "pronto", "Capacidade de pagamento aferida — pré-condição da garantia da União."],
  [5, "pronto", "Limites de endividamento verificados no rito COFIEX/STN."],
  [6, "em_elaboracao", "Relatório de emissões de GEE elaborado; inventário completo em construção."],
  [7, "em_elaboracao", "Plano Municipal de Adaptação entre as frentes estratégicas da Sema."],
  [8, "em_elaboracao", "Histórico de alagamentos consolidado; mapa formal de vulnerabilidade em produção."],
  [9, "pronto", "Nota conceitual é o núcleo da carta consulta à COFIEX."],
  [10, "pronto", "Estudos de concepção sustentando o pleito."],
  [11, "em_elaboracao", "Viabilidade técnico-econômica no padrão do banco, etapa da negociação."],
  [12, "em_elaboracao", "Projetos executivos por lote, produzidos ao longo da preparação."],
  [13, "pronto", "Orçamento e cronograma fechados para o montante de US$ 105 milhões."],
  [14, "pendente", "Plano de aquisições segue regras do NDB, definidas na contratação."],
  [15, "em_elaboracao", "Licenciamento de intervenção em canais e dragagem do Poxim."],
  [16, "em_elaboracao", "Faixas de domínio e desapropriações levantadas por trecho."],
  [17, "pendente", "Avaliação ambiental e social no padrão do financiador, exigida na negociação."],
  [18, "em_elaboracao", "Consulta às comunidades afetadas pelas obras."],
  [19, "pendente", "Indicadores desagregados de gênero e inclusão."],
  [20, "em_elaboracao", "Metas definidas; linha de base e fontes de verificação em construção."],
  [21, "pendente", "Cálculo de emissões evitadas não integrava o pleito."],
  [22, "pendente", "Plano de operação e manutenção pós-implantação."],
  [23, "pendente", "UGP formalizada acompanha a assinatura do contrato."],
  [24, "pronto", "Certidões e regularidade verificadas no rito."],
  [25, "pronto", "Contrapartida municipal comprometida na estrutura da operação."],
];

async function api(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, { headers: H, ...opcoes });
  const corpo = await r.text();
  if (!r.ok) throw new Error(`${caminho} → ${r.status} ${corpo}`);
  return corpo ? JSON.parse(corpo) : null;
}

async function main() {
  const [municipio] = await api("municipios?select=id,nome&limit=1");
  const [gestor] = await api("perfis?select=id&papel=eq.prefeitura_gestor&limit=1");
  if (!municipio || !gestor) throw new Error("Município ou gestor não encontrados.");

  // Idempotente: recarregar o case não deve empilhar cópias.
  const existentes = await api(`projetos_captacao?nome=eq.${encodeURIComponent(NOME)}&select=id`);
  for (const p of existentes) {
    await api(`projetos_captacao?id=eq.${p.id}`, { method: "DELETE" });
  }

  const [projeto] = await api("projetos_captacao", {
    method: "POST",
    body: JSON.stringify({
      municipio_id: municipio.id,
      nome: NOME,
      descricao: DESCRICAO,
      tema: "drenagem",
      // US$ 84 mi ≈ R$ 435 milhões na conversão informada pelo NDB à época
      valor_estimado_brl: 435000000,
      situacao: "preparacao",
      criado_por: gestor.id,
    }),
  });

  await api("diagnostico_respostas", {
    method: "POST",
    body: JSON.stringify(
      RESPOSTAS.map(([questao_id, resposta, evidencia]) => ({
        projeto_id: projeto.id,
        questao_id,
        resposta,
        evidencia,
        origem: "manual",
        respondido_por: gestor.id,
      })),
    ),
  });

  await api("projeto_documentos", {
    method: "POST",
    body: JSON.stringify(
      DOCUMENTOS.map(([documento_id, situacao, observacao]) => ({
        projeto_id: projeto.id,
        documento_id,
        situacao,
        observacao,
        atualizado_por: gestor.id,
      })),
    ),
  });

  const pesos = [5, 7, 5, 6, 5, 6, 6, 5, 6, 5, 4, 4, 3, 5, 6, 5, 5, 4, 3, 4];
  const pontos = RESPOSTAS.reduce((s, [id, r]) => {
    const peso = pesos[id - 1];
    return s + (r === "sim" ? peso : r === "parcial" ? peso / 2 : 0);
  }, 0);

  console.log(`case carregado em ${municipio.nome}`);
  console.log(`  projeto:    ${projeto.id}`);
  console.log(`  diagnóstico ${pontos} de 99 pontos → ${Math.round((pontos / 99) * 100)}%`);
  console.log(`  documentos: ${DOCUMENTOS.filter(([, s]) => s === "pronto").length} prontos de 25`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
