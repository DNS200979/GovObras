/**
 * Case de referência: Campinas e o City Climate Finance Gap Fund.
 *
 * O par do case de Aracaju, na outra ponta do fluxo. Aracaju mostra crédito
 * multilateral com um projeto já estruturado; Campinas mostra assistência
 * técnica de preparação, que é onde um projeto em estágio de ideia deve
 * começar — e que não paga a obra.
 *
 * O QUE É FATO, com fonte:
 *   - O Gap Fund apoiou Campinas para promover adaptação às mudanças
 *     climáticas e reduzir risco de inundação com soluções baseadas na
 *     natureza ao longo do rio Capivari. Anunciado no balanço do primeiro ano
 *     do fundo, em 23/09/2021, junto de outras 32 cidades.
 *   - O Gap Fund é capitalizado em € 55 milhões (meta de ao menos € 100
 *     milhões), financiado por Alemanha e Luxemburgo, implementado por Banco
 *     Mundial e BEI com a GIZ, e articulado com GCoM, ICLEI, C40 e CCFLA.
 *     As 33 cidades do primeiro ano tinham potencial estimado de destravar
 *     € 4 bilhões em investimento.
 *   - Campinas entrou na rede ICLEI em 2015, contratou a WayCarbon em janeiro
 *     de 2018 e foi o primeiro município do Brasil a fazer inventário
 *     regional de GEE — o inventário da Região Metropolitana de Campinas foi
 *     lançado em 10/05/2019. Transporte responde por 70,4% das emissões do
 *     município.
 *   - Campinas seguiu no Gap Fund Step-Up Project com Palmas e Rio de
 *     Janeiro, trabalhando modelos de financiamento para soluções baseadas na
 *     natureza.
 *
 * O QUE É RECONSTRUÇÃO:
 *   As 20 respostas e a situação dos documentos retratam como o projeto
 *   plausivelmente estava por volta de 2020, antes do apoio do Gap Fund. Não
 *   temos o dossiê interno da prefeitura de Campinas; cada resposta traz na
 *   evidência a base que a sustenta, e onde é dedução isso está escrito.
 *
 * Uso: node packages/database/scripts/seed-case-campinas.mjs
 */

import { carregarCase } from "./lib/captacao.mjs";

const NOME = "[CASE] Campinas — soluções baseadas na natureza no rio Capivari";

const DESCRICAO = `Operação real de assistência técnica, carregada como case de referência.

O City Climate Finance Gap Fund apoiou Campinas a promover adaptação às mudanças climáticas e reduzir o risco de inundação com soluções baseadas na natureza ao longo do rio Capivari. O apoio foi anunciado no balanço do primeiro ano do fundo, em 23/09/2021, junto de outras 32 cidades — conjunto com potencial estimado de destravar € 4 bilhões em investimento. O Gap Fund é financiado por Alemanha e Luxemburgo e implementado por Banco Mundial e BEI com a GIZ.

Vale a comparação com o case de Aracaju: lá, um programa já estruturado busca crédito multilateral; aqui, um projeto em estágio de ideia busca quem o torne financiável. O Gap Fund não paga a obra — entrega o estudo que faltava.

Campinas chega a esse ponto com uma base climática incomum: entrou na rede ICLEI em 2015 e foi o primeiro município do Brasil a fazer inventário regional de GEE, lançado em 10/05/2019 para toda a Região Metropolitana. O que faltava não era governança climática, era projeto.

O diagnóstico abaixo reconstrói como o projeto estava por volta de 2020, ANTES do apoio. A operação e os números são fato, com fonte; as respostas são reconstrução para demonstração — não temos o dossiê interno da prefeitura de Campinas.`;

/** [questaoId, resposta, evidência] — reconstrução de ~2020, pré-Gap Fund. */
const RESPOSTAS = [
  [1, "parcial", "Estrutura ambiental ativa e participação no ICLEI desde 2015, mas coordenação dedicada a este projeto é outra coisa. Inferência."],
  [2, "parcial", "O processo que levou ao inventário e ao Plano de Ação Climática começou em 2015; o plano local viria a ser concluído depois. Em elaboração à época. Fonte: Prefeitura de Campinas."],
  [3, "sim", "Inventário de emissões de GEE da Região Metropolitana lançado em 10/05/2019, com WayCarbon e ICLEI — primeiro inventário regional do Brasil. Transporte responde por 70,4% das emissões do município."],
  [4, "parcial", "O risco de inundação no Capivari é o problema que origina o projeto, mas modelagem hidrológica e mapa de vulnerabilidade eram parte do que se buscava desenvolver. Inferência."],
  [5, "parcial", "Prioridade ambiental declarada; vínculo orçamentário de uma obra ainda não dimensionada é outra etapa. Inferência."],
  [6, "parcial", "Problema (inundação) e abordagem (soluções baseadas na natureza no Capivari) definidos; componentes, beneficiários e dimensionamento eram justamente o que a assistência técnica ajudaria a fechar."],
  [7, "parcial", "A cidade tinha inventário e sabia sua matriz de emissões, mas o benefício climático deste projeto específico — inundação evitada, carbono associado — não estava quantificado."],
  [8, "nao", "Projeto em estágio de ideia; não havia CAPEX, OPEX e contingência estimados. É pré-requisito típico do apoio do Gap Fund não tê-los ainda."],
  [9, "nao", "Pré-viabilidade e estudo de alternativas são exatamente o produto que a assistência técnica do Gap Fund entrega."],
  [10, "nao", "Intervenção em várzea exige licenciamento, ainda não mapeado nesse estágio. Inferência."],
  [11, "nao", "Solução baseada na natureza ao longo do rio depende de domínio das áreas ribeirinhas; diagnóstico fundiário não feito. Inferência."],
  [12, "nao", "Consulta às comunidades ribeirinhas afetadas viria com a definição do escopo. Inferência."],
  [13, "nao", "Indicadores desagregados de gênero e inclusão não eram prática corrente em projetos municipais de drenagem no período. Inferência."],
  [14, "parcial", "A capacidade de medir existia — a cidade já operava um inventário com metodologia e ano-base —, mas a matriz de resultados do projeto, com linha de base e frequência, não estava montada."],
  [15, "parcial", "Município de grande porte conhece sua situação fiscal, mas a questão não era decisiva: assistência técnica não reembolsável não passa por CAPAG nem por rito de endividamento."],
  [16, "parcial", "O Gap Fund pede compromisso municipal, não necessariamente contrapartida financeira; equipe e tempo da prefeitura contam como aporte."],
  [17, "nao", "Solução baseada na natureza exige manejo continuado da várzea; o plano de operação e manutenção depende do projeto, que ainda não existia."],
  [18, "parcial", "Secretarias com capacidade técnica instalada, mas unidade de gerenciamento específica não formada. Inferência."],
  [19, "nao", "Regras de aquisição do financiador só passam a importar quando há obra a contratar. Inferência."],
  [20, "sim", "Diálogo consolidado com parceiros técnicos: ICLEI desde 2015, e a própria manifestação ao Gap Fund, que resultou no apoio anunciado em 23/09/2021."],
];

/**
 * [documentoId, situação, observação] na rota de assistência técnica, ~2020.
 * A rota omite CAPAG, limites de endividamento, lei autorizativa, projeto
 * básico, plano de aquisições e certidões — nada disso se aplica a apoio não
 * reembolsável de preparação.
 */
const DOCUMENTOS = [
  [1, "pronto", "Manifestação de interesse da cidade ao Gap Fund — a porta de entrada do apoio."],
  [3, "em_elaboracao", "Vínculo orçamentário desejável na rota, ainda sem obra dimensionada."],
  [6, "pronto", "Inventário de GEE da RMC lançado em 10/05/2019, primeiro regional do país."],
  [7, "em_elaboracao", "Plano de ação climática em processo desde a entrada no ICLEI, em 2015."],
  [8, "em_elaboracao", "Modelagem de risco de inundação no Capivari, parte do que se buscava desenvolver."],
  [9, "em_elaboracao", "Nota conceitual sendo formatada — o Gap Fund atua justamente aqui."],
  [10, "pendente", "Pré-viabilidade é o produto esperado da assistência técnica."],
  [11, "pendente", "Viabilidade técnico-econômica, etapa seguinte à pré-viabilidade."],
  [13, "pendente", "Orçamento e cronograma dependem do dimensionamento do projeto."],
  [15, "pendente", "Estratégia de licenciamento para intervenção em várzea."],
  [16, "pendente", "Situação dominial das áreas ribeirinhas do Capivari."],
  [17, "pendente", "Avaliação ambiental e social no padrão do financiador."],
  [18, "pendente", "Consulta às comunidades ribeirinhas afetadas."],
  [19, "pendente", "Abordagem de gênero e grupos vulneráveis."],
  [20, "em_elaboracao", "Base de medição existente pelo inventário; matriz do projeto por montar."],
  [21, "em_elaboracao", "Inventário dá a base metodológica; falta o cálculo do projeto."],
  [22, "pendente", "Manejo continuado da várzea, definido junto com o projeto."],
  [23, "pendente", "Unidade de gerenciamento específica não formada."],
  [25, "em_elaboracao", "Compromisso municipal de equipe e tempo, aporte que o Gap Fund espera."],
];

carregarCase({
  nome: NOME,
  descricao: DESCRICAO,
  tema: "adaptacao_resiliencia",
  // Assistência técnica de preparação não tem valor de obra associado: o
  // próprio catálogo registra "não financia a obra".
  valorBrl: null,
  situacao: "diagnostico",
  respostas: RESPOSTAS,
  documentos: DOCUMENTOS,
}).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
