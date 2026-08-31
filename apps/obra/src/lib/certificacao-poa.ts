/**
 * Certificação em Sustentabilidade Ambiental de Porto Alegre.
 *
 * Base: LC nº 872/2020 + Decreto nº 21.789/2022 (e Anexo I) + Decreto nº
 * 23.226/2025 (IPTU) + IN nº 011/2025 + IN SMAMUS nº 001/2026 (renovação).
 *
 * POR QUE ISTO EXISTE COMO MÓDULO PRÓPRIO
 * A régua que o sistema já tinha (`municipios.faixa_regua`) é de eixo único:
 * intensidade em kgCO₂e/m² cai numa faixa, a faixa dá o benefício. O programa
 * de Porto Alegre não funciona assim. Ele pontua SETE dimensões separadas,
 * cada uma com mínimo próprio, e o selo sai da CONTAGEM de dimensões que
 * bateram o mínimo — não de uma nota agregada. Uma obra pode ter intensidade
 * excelente e ficar sem selo nenhum, porque energia/GEE é uma dimensão de
 * sete, e as outras seis não se compensam entre si.
 *
 * Por isso a régua de faixas continua valendo para o balanço de carbono, e
 * isto aqui é um segundo eixo, paralelo. O inventário da obra alimenta a
 * dimensão ENE; não determina o selo sozinho.
 *
 * SOBRE OS PONTOS
 * O Decreto e a análise fixam alguns valores (telhado verde 50% = 2 pontos,
 * reuso de águas negras 50% = 7 pontos, coleta seletiva = 2 pontos...). Outros
 * o Anexo I define por faixa que não está transcrita aqui. Esses ficam com
 * `pontos: null` de propósito: quem preenche informa o valor lido no Anexo,
 * e o sistema soma. Chutar pontuação de programa legal seria produzir número
 * errado com cara de número certo.
 *
 * Fica em código, e não no banco, pela mesma razão de `roteiros-ativo.ts`:
 * é norma versionada, muda por revisão de decreto, não por operação do
 * usuário.
 */

export const BASE_LEGAL = [
  {
    norma: "LC nº 872/2020",
    oQueEstabelece: "Institui a Certificação em Sustentabilidade Ambiental no município.",
  },
  {
    norma: "Decreto nº 21.789/2022",
    oQueEstabelece:
      "Regulamenta o programa: as sete dimensões e suas pontuações mínimas (art. 9º), " +
      "a análise prioritária de licenciamento (art. 11), o acréscimo de altura (art. 12) e " +
      "o cancelamento por descaracterização (art. 14). O Anexo I traz os critérios pontuáveis.",
  },
  {
    norma: "LC nº 7/1973, art. 82-B + LC nº 1.040/2025 + Decreto nº 23.226/2025",
    oQueEstabelece:
      "Base do IPTU Sustentável: percentual por nível de selo e a regra de qual exercício o " +
      "benefício começa a valer conforme a data do pedido.",
  },
  {
    norma: "IN nº 011/2025",
    oQueEstabelece:
      "Para projetos executados, exige plano de conscientização permanente vinculado à " +
      "operação condominial no item correspondente da dimensão Resíduos.",
  },
  {
    norma: "IN SMAMUS nº 001/2026",
    oQueEstabelece:
      "Permite renovar a certificação de projeto ainda em construção, mantida a categoria, " +
      "desde que preservadas as ações que sustentaram a pontuação.",
  },
] as const;

// ============================================================
// Dimensões e critérios (Anexo I)
// ============================================================

export type CodigoDimensao = "BIO" | "CLI" | "AGU" | "ENE" | "RES" | "MAT" | "MOB";

/** Escala quando o critério pontua por grau de atendimento — as faixas são excludentes. */
export interface FaixaCriterio {
  condicao: string;
  pontos: number;
}

export interface CriterioDimensao {
  codigo: string;
  criterio: string;
  /**
   * Pontuação fixa quando o Decreto ou o Anexo a declaram de forma inequívoca.
   * `null` quando o Anexo I define por faixa não transcrita — nesse caso o
   * valor é informado por quem preenche, com o Anexo à mão.
   */
  pontos: number | null;
  faixas?: FaixaCriterio[];
  /** O que a SMAMUS pede como comprovação deste item. */
  documentos: string[];
  observacao?: string;
}

export interface Dimensao {
  codigo: CodigoDimensao;
  nome: string;
  /** Pontuação mínima para a dimensão contar como aprovada (art. 9º). */
  minimo: number;
  criterios: CriterioDimensao[];
}

export const DIMENSOES: Dimensao[] = [
  {
    codigo: "BIO",
    nome: "Conservação da Biodiversidade Local",
    minimo: 10,
    criterios: [
      {
        codigo: "BIO-1",
        criterio: "Uso de espécies nativas autóctones no paisagismo",
        pontos: null,
        documentos: ["Projeto paisagístico", "Memorial descritivo"],
        observacao: "O Anexo I pontua por percentual de vegetação nativa adotada.",
      },
      {
        codigo: "BIO-2",
        criterio: "Preservação das espécies nativas existentes no terreno",
        pontos: null,
        documentos: ["Levantamento da vegetação existente", "Memorial descritivo"],
        observacao: "O Anexo I pontua por percentual de vegetação preservada.",
      },
      {
        codigo: "BIO-3",
        criterio: "Implantação de espécies ameaçadas de extinção",
        pontos: null,
        documentos: ["Projeto paisagístico com identificação das espécies", "Memorial descritivo"],
      },
      {
        codigo: "BIO-4",
        criterio: "Medidas contra colisão de aves em áreas envidraçadas",
        pontos: null,
        documentos: ["Especificação técnica do vidro", "Memorial descritivo"],
        observacao: "A pontuação varia conforme a solução adotada.",
      },
    ],
  },
  {
    codigo: "CLI",
    nome: "Adequação às Condições Climáticas",
    minimo: 10,
    criterios: [
      {
        codigo: "CLI-1",
        criterio: "Redução de ilhas de calor — cobertura com SRI adequado",
        pontos: null,
        documentos: ["Especificação técnica do material de cobertura, com o SRI declarado"],
      },
      {
        codigo: "CLI-2",
        criterio: "Redução de ilhas de calor — pisos externos de maior refletância ou paver com grama",
        pontos: null,
        documentos: ["Projeto de áreas externas", "Especificação do piso"],
      },
      {
        codigo: "CLI-3",
        criterio: "Telhado verde",
        pontos: null,
        faixas: [
          { condicao: "50% da cobertura", pontos: 2 },
          { condicao: "75% da cobertura", pontos: 4 },
        ],
        documentos: ["Projeto de cobertura com a área de telhado verde discriminada"],
      },
      {
        codigo: "CLI-4",
        criterio: "Parede verde em ao menos 5% das fachadas",
        pontos: 3,
        documentos: ["Projeto de fachadas com a área de parede verde discriminada"],
      },
      {
        codigo: "CLI-5",
        criterio: "Desempenho da envoltória — isolamento de cobertura e fachadas, vidros de alto desempenho",
        pontos: null,
        documentos: ["Memorial de desempenho térmico", "Especificação dos vidros e isolantes"],
      },
      {
        codigo: "CLI-6",
        criterio: "Ventilação e iluminação natural em ao menos 75% dos ambientes regularmente ocupados",
        pontos: null,
        documentos: ["Cálculo de ventilação natural", "Cálculo de iluminação natural"],
      },
    ],
  },
  {
    codigo: "AGU",
    nome: "Água",
    minimo: 10,
    criterios: [
      {
        codigo: "AGU-1",
        criterio: "Economia de água em metais e louças, ante o padrão de mercado",
        pontos: null,
        faixas: [
          { condicao: "redução de 20%", pontos: 2 },
          { condicao: "redução de 35%", pontos: 3 },
          { condicao: "redução de 40%", pontos: 4 },
        ],
        documentos: ["Memorial de cálculo do consumo", "Especificação dos metais e louças"],
        observacao: "O cálculo considera os metais e louças efetivamente instalados na edificação.",
      },
      {
        codigo: "AGU-2",
        criterio: "Reuso de águas cinzas para 50% da demanda",
        pontos: 5,
        documentos: ["Projeto do sistema de tratamento, reservação e distribuição", "ART do projeto"],
        observacao: "Exige tratamento, reservação e distribuição próprios.",
      },
      {
        codigo: "AGU-3",
        criterio: "Reuso de águas negras para 50% da demanda",
        pontos: 7,
        documentos: ["Projeto do sistema de tratamento, reservação e distribuição", "ART do projeto"],
      },
      {
        codigo: "AGU-4",
        criterio: "Aproveitamento de águas pluviais — captação, reservação e distribuição de água não potável",
        pontos: null,
        documentos: ["Projeto hidrossanitário com a rede de água não potável", "Memorial de dimensionamento do reservatório"],
      },
      {
        codigo: "AGU-5",
        criterio: "Paisagismo eficiente — dispensa de irrigação permanente ou irrigação automatizada",
        pontos: null,
        documentos: ["Projeto paisagístico", "Projeto do sistema de irrigação, quando houver"],
      },
      {
        codigo: "AGU-6",
        criterio: "Controle de drenagem — área permeável adicional e pavimentação permeável drenante",
        pontos: null,
        documentos: ["Projeto de drenagem", "Planta com as áreas permeáveis discriminadas"],
      },
    ],
  },
  {
    codigo: "ENE",
    nome: "Energia e Emissão de GEE",
    minimo: 10,
    criterios: [
      {
        codigo: "ENE-1",
        criterio: "Aquecimento solar de água — sistema central",
        pontos: 5,
        documentos: ["Projeto do sistema de aquecimento solar", "ART do projeto"],
      },
      {
        codigo: "ENE-2",
        criterio: "Energia renovável — geração local atendendo parte do consumo",
        pontos: null,
        documentos: [
          "Projeto do sistema de geração",
          "Memorial da participação da renovável no consumo previsto",
        ],
        observacao:
          "O Anexo prevê faixas conforme a participação da renovável. É o mesmo dado do requisito " +
          "ENE do inventário de carbono — a fatura com energia compensada serve aos dois.",
      },
      {
        codigo: "ENE-3",
        criterio: "Iluminação em LED em 100% das áreas comuns",
        pontos: 3,
        documentos: ["Projeto luminotécnico das áreas comuns"],
      },
      {
        codigo: "ENE-4",
        criterio: "Circuitos independentes e dispositivos economizadores",
        pontos: 2,
        documentos: ["Projeto elétrico com os circuitos discriminados"],
      },
      {
        codigo: "ENE-5",
        criterio: "Iluminação externa projetada para evitar poluição luminosa",
        pontos: null,
        documentos: ["Projeto luminotécnico externo"],
      },
      {
        codigo: "ENE-6",
        criterio: "Redução de emissão de GEE do empreendimento",
        pontos: null,
        documentos: ["Inventário de emissões da obra", "Memorial do percentual de redução"],
        observacao:
          "É por aqui que o inventário do CarbonFree entra na certificação: energia → combustível " +
          "→ GEE → percentual de redução. A intensidade em kgCO₂e/m² não substitui as outras seis " +
          "dimensões.",
      },
    ],
  },
  {
    codigo: "RES",
    nome: "Resíduos",
    minimo: 5,
    criterios: [
      {
        codigo: "RES-1",
        criterio:
          "Coleta seletiva com espaço central e acessível para papel, vidro, plástico, metais, eletrônicos e óleo de cozinha",
        pontos: 2,
        documentos: ["Planta do local de armazenamento com as frações discriminadas"],
      },
      {
        codigo: "RES-2",
        criterio: "Programa permanente de conscientização",
        pontos: 3,
        documentos: ["Plano de conscientização permanente"],
        observacao:
          "Para projeto executado, a IN nº 011/2025 exige que o plano esteja vinculado à operação " +
          "condominial — plano solto, sem essa vinculação, não sustenta o item.",
      },
      {
        codigo: "RES-3",
        criterio: "Trituradores ou compactadores de resíduos",
        pontos: 2,
        documentos: ["Especificação do equipamento", "Planta com a localização"],
      },
      {
        codigo: "RES-4",
        criterio: "Compostagem",
        pontos: 1,
        documentos: ["Projeto do sistema de compostagem"],
      },
      {
        codigo: "RES-5",
        criterio:
          "Gestão dos resíduos da construção — PGRS que demonstre desvio de aterro por redução, reutilização ou reciclagem",
        pontos: null,
        documentos: ["PGRS com ART específica", "Demonstrativo do desvio de aterro"],
        observacao:
          "É o mesmo conjunto do requisito RCC do inventário: MTR, CDF e balanço de massa provam " +
          "os dois — o desvio de aterro e este item da certificação.",
      },
    ],
  },
  {
    codigo: "MAT",
    nome: "Materiais",
    minimo: 5,
    criterios: [
      {
        codigo: "MAT-1",
        criterio: "Materiais reciclados como percentual do custo total dos materiais",
        pontos: null,
        documentos: ["Planilha de custo dos materiais", "NF-e que identifiquem o conteúdo reciclado"],
      },
      {
        codigo: "MAT-2",
        criterio:
          "Madeira certificada em ao menos 50% da madeira utilizada, temporária e permanente",
        pontos: null,
        documentos: ["Certificado de cadeia de custódia", "NF-e da madeira"],
        observacao: "O percentual inclui a madeira de uso temporário (fôrmas, escoramento).",
      },
      {
        codigo: "MAT-3",
        criterio: "Adesivos, selantes e tintas de baixa emissão de compostos orgânicos voláteis",
        pontos: null,
        documentos: ["Ficha técnica com o teor de COV declarado", "NF-e dos produtos"],
      },
      {
        codigo: "MAT-4",
        criterio: "Materiais rapidamente renováveis como percentual do custo total dos materiais",
        pontos: null,
        documentos: ["Planilha de custo dos materiais", "Especificação dos produtos"],
      },
      {
        codigo: "MAT-5",
        criterio: "Materiais regionais — extraídos, recuperados e produzidos no raio previsto",
        pontos: null,
        documentos: ["Declaração de origem do fornecedor", "NF-e com o endereço de produção"],
        observacao:
          "O Anexo usa 800 km como referência em um dos critérios. É o dado que a concreteira " +
          "cadastrada já pode alimentar: fabricante, origem, distância, conteúdo reciclado, DAP.",
      },
    ],
  },
  {
    codigo: "MOB",
    nome: "Acessibilidade, Mobilidade e Humanização",
    minimo: 10,
    criterios: [
      {
        codigo: "MOB-1",
        criterio:
          "Proximidade de transporte coletivo — até 400 m de parada de ônibus ou 800 m de estação de trem",
        pontos: null,
        documentos: ["Planta de situação com a distância cotada até a parada ou estação"],
      },
      {
        codigo: "MOB-2",
        criterio: "Bicicletário dimensionado pelo número de usuários, incluindo visitantes",
        pontos: null,
        documentos: ["Planta do bicicletário", "Memorial de dimensionamento por número de usuários"],
        observacao: "Os requisitos diferem entre uso residencial e comercial/serviços.",
      },
      {
        codigo: "MOB-3",
        criterio: "Vagas para veículos elétricos com sinalização, infraestrutura de recarga e localização adequada",
        pontos: null,
        documentos: ["Projeto elétrico da infraestrutura de recarga", "Planta de garagem com a sinalização"],
      },
      {
        codigo: "MOB-4",
        criterio:
          "Fachada e espaço urbano — recuo de muros, ausência de grades, transparência da fachada térrea, paisagismo, áreas de permanência, paraciclos, horta comunitária",
        pontos: null,
        documentos: ["Projeto arquitetônico do térreo e do passeio", "Projeto paisagístico"],
      },
    ],
  },
];

export const DIMENSAO_POR_CODIGO: Record<CodigoDimensao, Dimensao> = Object.fromEntries(
  DIMENSOES.map((d) => [d.codigo, d]),
) as Record<CodigoDimensao, Dimensao>;

// ============================================================
// Níveis do selo e benefícios
// ============================================================

export type NivelSelo = "bronze" | "prata" | "ouro" | "diamante";

export interface Beneficios {
  /** Teto do desconto de IPTU. O percentual efetivo é definido pelo município. */
  iptuTetoPct: number;
  /** Acréscimo sobre a altura máxima da edificação (art. 12). */
  acrescimoAlturaPct: number;
  /** Análise prioritária do licenciamento urbanístico e ambiental (art. 11). */
  licenciamentoPrioritario: boolean;
}

export interface DefinicaoNivel {
  nivel: NivelSelo;
  rotulo: string;
  /** Quantas das sete dimensões precisam ter atingido o mínimo. */
  dimensoesMinimas: number;
  beneficios: Beneficios;
  baseLegal: string;
}

/** Do mais alto para o mais baixo — a busca do nível atingido depende dessa ordem. */
export const NIVEIS: DefinicaoNivel[] = [
  {
    nivel: "diamante",
    rotulo: "Diamante",
    dimensoesMinimas: 5,
    beneficios: { iptuTetoPct: 10, acrescimoAlturaPct: 20, licenciamentoPrioritario: true },
    baseLegal: "Decreto nº 21.789/2022, art. 9º, I e art. 12, III",
  },
  {
    nivel: "ouro",
    rotulo: "Ouro",
    dimensoesMinimas: 4,
    beneficios: { iptuTetoPct: 7, acrescimoAlturaPct: 15, licenciamentoPrioritario: true },
    baseLegal: "Decreto nº 21.789/2022, art. 9º, II e art. 12, II",
  },
  {
    nivel: "prata",
    rotulo: "Prata",
    dimensoesMinimas: 3,
    beneficios: { iptuTetoPct: 5, acrescimoAlturaPct: 10, licenciamentoPrioritario: true },
    baseLegal: "Decreto nº 21.789/2022, art. 9º, III e art. 12, I",
  },
  {
    nivel: "bronze",
    rotulo: "Bronze",
    dimensoesMinimas: 2,
    beneficios: { iptuTetoPct: 3, acrescimoAlturaPct: 0, licenciamentoPrioritario: false },
    baseLegal: "Decreto nº 21.789/2022, art. 9º, IV",
  },
];

/**
 * Nível atingido por contagem de dimensões aprovadas.
 *
 * Diamante exige CINCO dimensões, não as sete. É o erro de leitura mais comum
 * do programa, e quem assume sete desiste do selo mais alto sem precisar.
 */
export function nivelPorDimensoesAprovadas(aprovadas: number): DefinicaoNivel | null {
  return NIVEIS.find((n) => aprovadas >= n.dimensoesMinimas) ?? null;
}

/** Próximo degrau e quantas dimensões faltam para ele. `null` no topo. */
export function proximoNivel(
  aprovadas: number,
): { nivel: DefinicaoNivel; faltamDimensoes: number } | null {
  const acima = NIVEIS.filter((n) => n.dimensoesMinimas > aprovadas);
  if (acima.length === 0) return null;
  const proximo = acima[acima.length - 1];
  return { nivel: proximo, faltamDimensoes: proximo.dimensoesMinimas - aprovadas };
}

// ============================================================
// Avaliação
// ============================================================

export type PontosPorDimensao = Partial<Record<CodigoDimensao, number>>;

export interface AvaliacaoDimensao {
  codigo: CodigoDimensao;
  nome: string;
  pontos: number;
  minimo: number;
  aprovada: boolean;
  /** Quanto falta para a dimensão aprovar. Zero quando já aprovou. */
  faltam: number;
}

export interface EntradaFinanceira {
  /** IPTU anual informado pela construtora, em reais. */
  iptuAnual?: number;
  /** Altura máxima da edificação pelo regime urbanístico, em metros. */
  alturaBasicaM?: number;
}

export interface ResultadoCertificacao {
  dimensoes: AvaliacaoDimensao[];
  aprovadas: number;
  nivel: DefinicaoNivel | null;
  proximo: { nivel: DefinicaoNivel; faltamDimensoes: number } | null;
  /** Dimensões que mais perto estão de aprovar — onde investir primeiro. */
  maisProximasDeAprovar: AvaliacaoDimensao[];
  economiaIptuAnualMaxima: number | null;
  /** Teto teórico no ciclo de validade do certificado (3 anos). */
  economiaCicloMaxima: number | null;
  alturaPotencialM: number | null;
}

export function avaliarDimensoes(pontos: PontosPorDimensao): AvaliacaoDimensao[] {
  return DIMENSOES.map((d) => {
    const obtidos = pontos[d.codigo] ?? 0;
    return {
      codigo: d.codigo,
      nome: d.nome,
      pontos: obtidos,
      minimo: d.minimo,
      aprovada: obtidos >= d.minimo,
      faltam: Math.max(0, d.minimo - obtidos),
    };
  });
}

/** Validade do certificado: 3 anos da emissão. */
export const VALIDADE_ANOS = 3;

export function simularCertificacao(
  pontos: PontosPorDimensao,
  financeiro: EntradaFinanceira = {},
): ResultadoCertificacao {
  const dimensoes = avaliarDimensoes(pontos);
  const aprovadas = dimensoes.filter((d) => d.aprovada).length;
  const nivel = nivelPorDimensoesAprovadas(aprovadas);

  const economiaIptuAnualMaxima =
    nivel && financeiro.iptuAnual !== undefined
      ? (financeiro.iptuAnual * nivel.beneficios.iptuTetoPct) / 100
      : null;

  return {
    dimensoes,
    aprovadas,
    nivel,
    proximo: proximoNivel(aprovadas),
    maisProximasDeAprovar: dimensoes
      .filter((d) => !d.aprovada)
      .sort((a, b) => a.faltam - b.faltam),
    economiaIptuAnualMaxima,
    economiaCicloMaxima:
      economiaIptuAnualMaxima === null ? null : economiaIptuAnualMaxima * VALIDADE_ANOS,
    alturaPotencialM:
      nivel && financeiro.alturaBasicaM !== undefined
        ? financeiro.alturaBasicaM * (1 + nivel.beneficios.acrescimoAlturaPct / 100)
        : null,
  };
}

// ============================================================
// Prazos — quando o IPTU começa a valer
// ============================================================

/**
 * Exercício em que o desconto de IPTU passa a valer, conforme a data do
 * pedido (Decreto nº 23.226/2025).
 *
 * Pedido de 1º de janeiro a 31 de agosto → exercício seguinte.
 * Pedido de 1º de setembro a 31 de dezembro → segundo exercício seguinte.
 *
 * Um dia de atraso custa um ano inteiro de desconto, e é por isso que isto
 * vira alerta na tela em vez de nota de rodapé.
 */
export function exercicioDoBeneficio(dataPedido: Date): number {
  const ano = dataPedido.getFullYear();
  // getMonth() é zero-based: 8 = setembro.
  return dataPedido.getMonth() >= 8 ? ano + 2 : ano + 1;
}

/** Último dia para pedir e ainda pegar o exercício desejado: 31/08 do ano anterior. */
export function prazoParaExercicio(exercicio: number): Date {
  return new Date(exercicio - 1, 7, 31);
}

/** Frase pronta do alerta de prazo, a partir de hoje. */
export function alertaDePrazo(hoje: Date): {
  exercicioSePedirHoje: number;
  prazoParaGanharUmAno: Date | null;
  mensagem: string;
} {
  const exercicio = exercicioDoBeneficio(hoje);

  // A janela é sempre a de 31/08 do ANO CORRENTE. Depois dela não existe
  // antecipação a oferecer: o pedido já escorregou, e a próxima data de 31/08
  // devolve o mesmo exercício que o pedido de hoje devolveria.
  const prazoDesteAno = new Date(hoje.getFullYear(), 7, 31);
  const janelaAberta = hoje <= prazoDesteAno;
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");

  return {
    exercicioSePedirHoje: exercicio,
    prazoParaGanharUmAno: janelaAberta ? prazoDesteAno : null,
    mensagem: janelaAberta
      ? `Pedido protocolado até ${fmt(prazoDesteAno)} garante o benefício já no IPTU ${exercicio}. ` +
        `Depois dessa data, o desconto só começa no exercício ${exercicio + 1}.`
      : `A janela do exercício ${exercicio - 1} fechou em 31/08. Pedido protocolado agora ` +
        `passa a valer a partir do IPTU ${exercicio}.`,
  };
}

export function validadeCertificado(emitidoEm: Date): Date {
  const fim = new Date(emitidoEm);
  fim.setFullYear(fim.getFullYear() + VALIDADE_ANOS);
  return fim;
}

// ============================================================
// Os dois trâmites — SMAMUS certifica, SMF concede
// ============================================================

/**
 * O documento da prefeitura é explícito: a SMAMUS emite o certificado, e o
 * contribuinte faz um PEDIDO SEPARADO à Secretaria Municipal da Fazenda para
 * receber o benefício fiscal. São dois processos, e a construtora que trata
 * como um só sai com o certificado na mão e sem desconto nenhum.
 */
export type StatusCertificacao =
  | "nao_iniciada"
  | "em_preparacao"
  | "protocolada"
  | "em_analise"
  | "aprovada"
  | "indeferida"
  | "cancelada";

export type StatusBeneficioFiscal =
  | "nao_solicitado"
  | "solicitado"
  | "deferido"
  | "indeferido";

export const statusCertificacaoLabel: Record<StatusCertificacao, string> = {
  nao_iniciada: "Não iniciada",
  em_preparacao: "Em preparação",
  protocolada: "Protocolada no Portal de Licenciamento",
  em_analise: "Em análise pela SMAMUS",
  aprovada: "Aprovada — certificado emitido",
  indeferida: "Indeferida",
  cancelada: "Cancelada",
};

export const statusBeneficioFiscalLabel: Record<StatusBeneficioFiscal, string> = {
  nao_solicitado: "Não solicitado à SMF",
  solicitado: "Solicitado à SMF",
  deferido: "Deferido pela SMF",
  indeferido: "Indeferido pela SMF",
};

/** Documentação mínima do pedido, pelo Portal de Licenciamento. */
export const DOCUMENTACAO_MINIMA = [
  "Formulário / Quadro de Pontuação",
  "ART, RRT ou TRT",
  "Matrícula ou certidão do Registro de Imóveis",
  "Planta de situação",
  "Documentos de comprovação de cada prática escolhida",
] as const;

/** O que vale para qualquer selo, além de pontuar. */
export const CONDICIONANTES_GERAIS = [
  {
    titulo: "Pontuar não basta",
    detalhe:
      "As ações sustentáveis precisam ser compatíveis com o cumprimento integral da legislação " +
      "ambiental, urbanística, edilícia e demais normas aplicáveis.",
  },
  {
    titulo: "Reforma alcança a edificação inteira",
    detalhe:
      "Em reforma ou modificação, as ações precisam ser consideradas para a edificação inteira " +
      "ou para as unidades existentes — não só para a área ampliada.",
  },
  {
    titulo: "O desconto de IPTU depende da Carta de Habitação",
    detalhe:
      "Obra em construção pode buscar a certificação e o incentivo urbanístico, mas o desconto " +
      "efetivo do IPTU exige prévia emissão da Carta de Habitação.",
  },
  {
    titulo: "A certificação pode ser cancelada",
    detalhe:
      "A Prefeitura pode vistoriar por amostragem. Descaracterizadas as práticas que sustentaram " +
      "a certificação, o certificado e os benefícios vinculados podem ser cancelados " +
      "(art. 14 do Decreto nº 21.789/2022).",
  },
  {
    titulo: "Renovação de projeto em construção",
    detalhe:
      "A IN SMAMUS nº 001/2026 permite renovar por mais 3 anos, na mesma categoria, se as ações " +
      "forem integralmente mantidas, não houver alteração que afete a pontuação, a obra seguir " +
      "em construção e o documento de responsabilidade técnica estiver atualizado.",
  },
] as const;

/**
 * O acréscimo de altura não é metro construído garantido — é teto que ainda
 * passa pelo regime urbanístico. Prometer área a partir do selo é o jeito
 * mais rápido de o benefício virar frustração.
 */
export const RESSALVAS_ALTURA = [
  "O acréscimo é concedido na etapa do projeto arquitetônico.",
  "Não entra no cálculo dos afastamentos nem no dimensionamento de pátios.",
  "Se o ganho resultar em saldo de ao menos 50% da altura mínima de um pavimento, pode ser permitido completar o pavimento inteiro, conforme as regras aplicáveis.",
  "O número de pavimentos adicionais continua condicionado ao Índice de Aproveitamento disponível.",
  "Há exclusões territoriais e programáticas previstas no Decreto — verificar restrição aeroportuária e regime urbanístico específico.",
] as const;
