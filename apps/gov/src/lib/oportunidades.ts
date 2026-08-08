/**
 * Catálogo de financiadores e programas de preparação de projetos.
 *
 * Transcrito da aba Oportunidades da Matriz de Financiamento Climático
 * Municipal (pesquisa de 2026-08-07). Como o diagnóstico e a matriz
 * documental, vive em código: é referência versionada, não dado operacional.
 *
 * Os valores são indicativos ou de operações anteriores — não representam
 * direito adquirido nem oferta automática, e as condições precisam ser
 * confirmadas na fonte oficial antes de protocolar qualquer coisa.
 */

export type Modalidade = "doacao" | "credito" | "assistencia_tecnica" | "garantia";
export type Acesso = "direto" | "indireto" | "intermediado" | "consorcio";
export type Estagio = "preparacao" | "investimento" | "ambos";
export type SituacaoOportunidade =
  | "ativo"
  | "programatico"
  | "chamada_aberta"
  | "chamada_encerrada";

export interface Oportunidade {
  id: number;
  nome: string;
  natureza: string;
  modalidades: Modalidade[];
  modalidadeNota: string;
  acesso: Acesso;
  acessoNota: string;
  estagio: Estagio;
  temas: string[];
  temasNota: string;
  abrangencia: string;
  faixa: string;
  contrapartida: string;
  rotaAcesso: string;
  situacao: SituacaoOportunidade;
  situacaoNota: string;
  prioridade: string;
  prazo: string;
  exigencias: string;
  fonte: string;
  /**
   * Faixas de prontidão em que a matriz recomenda este canal (índices de
   * FAIXAS: 0 = 0–39%, 1 = 40–59%, 2 = 60–79%, 3 = 80–100%), da coluna
   * "Canais recomendados" da aba Diagnóstico.
   *
   * Onde a coluna nomeia o financiador (Gap Fund, C40 CFF, BID, CAF, NDB,
   * Banco Mundial, FONPLATA, Fundo Amazônia, GCF, GEF, IKI, MAF, CCFLA) o
   * mapeamento é literal. Onde ela usa termo genérico — "assistência
   * técnica", "cooperação técnica", "bancos regionais" — atribuímos aos
   * canais que se encaixam: KfW/GIZ e AFD na cooperação técnica, BRDE/BDMG
   * nos bancos regionais, Adaptation Fund e EIB junto dos pares de mesma
   * natureza. Esses casos são leitura nossa da matriz, não texto dela.
   */
  faixasRecomendadas: number[];
}

export const OPORTUNIDADES: Oportunidade[] = [
  {
    id: 1,
    nome: "Green Climate Fund (GCF)",
    natureza: "Fundo multilateral",
    modalidades: ["doacao", "credito", "garantia", "assistencia_tecnica"],
    modalidadeNota: "Doação, crédito concessional, garantia e TA",
    acesso: "indireto",
    acessoNota: "Indireto",
    estagio: "ambos",
    temas: ["adaptacao_resiliencia", "infraestrutura_urbana", "residuos", "saneamento_agua"],
    temasNota: "Adaptação; mitigação; infraestrutura; resíduos; água",
    abrangencia: "Nacional",
    faixa: "Definida por projeto/programa",
    contrapartida: "Geralmente exigido ou valorizado",
    rotaAcesso: "Entidade Acreditada + anuência da autoridade nacional",
    situacao: "ativo",
    situacaoNota: "Canal permanente; depende de programação",
    prioridade: "Alta",
    prazo: "18–36 meses",
    exigencias:
      "Projeto transformacional; estudos; salvaguardas; gênero; MRV; no-objection",
    fonte: "https://www.greenclimate.fund/partners/accredited-entities",
    faixasRecomendadas: [2],
  },
  {
    id: 2,
    nome: "Global Environment Facility (GEF)",
    natureza: "Fundo multilateral",
    modalidades: ["doacao"],
    modalidadeNota: "Doação com cofinanciamento",
    acesso: "indireto",
    acessoNota: "Indireto",
    estagio: "ambos",
    temas: ["florestas_bioeconomia", "residuos", "infraestrutura_urbana"],
    temasNota: "Biodiversidade; cidades; resíduos; florestas; químicos",
    abrangencia: "Nacional",
    faixa: "Definida por ciclo/projeto",
    contrapartida: "Cofinanciamento relevante",
    rotaAcesso: "Agência GEF + ponto focal nacional + programa-país",
    situacao: "programatico",
    situacaoNota: "Programação por ciclos e projetos",
    prioridade: "Alta",
    prazo: "18–36 meses",
    exigencias: "Benefício ambiental global; agência implementadora; indicadores",
    fonte:
      "https://www.thegef.org/newsroom/feature-stories/resilient-infrastructure-brazils-cities-grows-roots",
    faixasRecomendadas: [2],
  },
  {
    id: 3,
    nome: "Adaptation Fund",
    natureza: "Fundo multilateral",
    modalidades: ["doacao"],
    modalidadeNota: "Doação",
    acesso: "indireto",
    acessoNota: "Indireto",
    estagio: "ambos",
    temas: ["adaptacao_resiliencia"],
    temasNota: "Adaptação; resiliência; comunidades vulneráveis",
    abrangencia: "Nacional e regional",
    faixa: "Definida pela janela vigente",
    contrapartida: "Pode exigir contribuição complementar",
    rotaAcesso: "Entidade Implementadora acreditada + endosso da autoridade designada",
    situacao: "ativo",
    situacaoNota: "Canal permanente por entidades",
    prioridade: "Média-Alta",
    prazo: "18–30 meses",
    exigencias: "Adicionalidade climática; vulnerabilidade; salvaguardas; endosso nacional",
    fonte: "https://www.adaptation-fund.org/apply-funding/designated-authorities/",
    faixasRecomendadas: [2],
  },
  {
    id: 4,
    nome: "Fundo Amazônia / BNDES",
    natureza: "Doações internacionais administradas no Brasil",
    modalidades: ["doacao"],
    modalidadeNota: "Não reembolsável",
    acesso: "direto",
    acessoNota: "Direto ou via chamada/parceiro",
    estagio: "investimento",
    temas: ["florestas_bioeconomia"],
    temasNota: "Florestas; fogo; fiscalização; bioeconomia; recuperação",
    abrangencia: "Amazônia Legal; temas específicos fora dela",
    faixa: "Em regra, apoio mínimo nacional de R$ 5 milhões nas diretrizes recentes",
    contrapartida: "Financeira ou não financeira",
    rotaAcesso: "BNDES/Fundo Amazônia conforme diretrizes e chamadas",
    situacao: "ativo",
    situacaoNota: "Ativo; observar focos e chamadas",
    prioridade: "Muito alta se elegível",
    prazo: "12–30 meses",
    exigencias: "Adicionalidade; escala; indicadores; transparência; sustentabilidade",
    fonte: "https://www.fundoamazonia.gov.br/pt/home/",
    faixasRecomendadas: [2],
  },
  {
    id: 5,
    nome: "Banco Interamericano de Desenvolvimento (BID)",
    natureza: "Banco multilateral",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito e cooperação técnica",
    acesso: "direto",
    acessoNota: "Direto estruturado",
    estagio: "ambos",
    temas: ["saneamento_agua", "mobilidade", "drenagem", "energia"],
    temasNota: "Saneamento; mobilidade; drenagem; gestão; energia",
    abrangencia: "Nacional",
    faixa: "Definida por operação",
    contrapartida: "Contrapartida municipal normalmente requerida",
    rotaAcesso: "Banco + COFIEX + STN/garantia quando aplicável",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Alta",
    prazo: "24–48 meses",
    exigencias: "Capacidade fiscal; estudos; aquisições; salvaguardas; UGP",
    fonte: "https://www.iadb.org/pt-br/quem-somos/representacoes-por-pais/brasil",
    faixasRecomendadas: [3],
  },
  {
    id: 6,
    nome: "CAF — Banco de Desenvolvimento da América Latina e Caribe",
    natureza: "Banco multilateral",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito e cooperação técnica",
    acesso: "direto",
    acessoNota: "Direto estruturado",
    estagio: "ambos",
    temas: ["infraestrutura_urbana", "mobilidade", "drenagem", "adaptacao_resiliencia"],
    temasNota: "Desenvolvimento urbano; mobilidade; drenagem; resiliência",
    abrangencia: "Nacional",
    faixa: "Operações municipais anteriores de dezenas de milhões de USD",
    contrapartida: "Contrapartida municipal",
    rotaAcesso: "CAF + COFIEX + rito de crédito externo",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Alta",
    prazo: "20–42 meses",
    exigencias: "Capacidade fiscal; projeto integrado; UGP; salvaguardas",
    fonte:
      "https://www.caf.com/pt/presente/noticias/financiamento-de-us-105-milhoes-para-desenvolvimento-urbano-de-santos/",
    faixasRecomendadas: [3],
  },
  {
    id: 7,
    nome: "Banco Mundial (IBRD)",
    natureza: "Banco multilateral",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito e assistência técnica",
    acesso: "direto",
    acessoNota: "Direto ou intermediado",
    estagio: "ambos",
    temas: ["infraestrutura_urbana", "saneamento_agua", "residuos", "adaptacao_resiliencia"],
    temasNota: "Infraestrutura; água; resíduos; adaptação; gestão pública",
    abrangencia: "Nacional",
    faixa: "Definida por operação",
    contrapartida: "Contrapartida e capacidade de endividamento",
    rotaAcesso: "Banco + União/ente + COFIEX conforme estrutura",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Alta",
    prazo: "24–48 meses",
    exigencias: "Estudos econômicos; aquisições; salvaguardas; fiscal",
    fonte: "https://www.worldbank.org/pt/country/brazil",
    faixasRecomendadas: [3],
  },
  {
    id: 8,
    nome: "New Development Bank (NDB)",
    natureza: "Banco multilateral BRICS",
    modalidades: ["credito"],
    modalidadeNota: "Crédito",
    acesso: "direto",
    acessoNota: "Direto ou intermediado",
    estagio: "investimento",
    temas: ["infraestrutura_urbana", "saneamento_agua", "mobilidade"],
    temasNota: "Infraestrutura urbana; água; saneamento; transporte",
    abrangencia: "Nacional",
    faixa: "Aracaju: US$ 84 mi + US$ 21 mi de contrapartida",
    contrapartida: "Contrapartida municipal",
    rotaAcesso: "NDB + COFIEX + garantia da União quando exigida",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Alta para projetos maduros",
    prazo: "24–48 meses",
    exigencias: "Escala; capacidade fiscal; contragarantia; projeto executivo",
    fonte:
      "https://www.ndb.int/news/new-development-bank-and-municipality-of-aracaju-sign-loan-agreement-for-urban-and-sustainable-infrastructure-program-aracaju-city-of-the-future/",
    faixasRecomendadas: [3],
  },
  {
    id: 9,
    nome: "European Investment Bank (EIB)",
    natureza: "Banco da União Europeia",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito e advisory",
    acesso: "intermediado",
    acessoNota: "Geralmente intermediado/parceria",
    estagio: "ambos",
    temas: ["energia", "saneamento_agua", "mobilidade", "infraestrutura_urbana"],
    temasNota: "Energia; saneamento; mobilidade; infraestrutura climática",
    abrangencia: "Nacional",
    faixa: "Definida por operação ou linha intermediada",
    contrapartida: "Conforme operação",
    rotaAcesso: "EIB + banco parceiro/programa; ou estrutura soberana",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Média-Alta",
    prazo: "18–42 meses",
    exigencias: "Bancabilidade; clima; padrões ambientais e sociais",
    fonte: "https://www.eib.org/en/projects/country/brazil",
    faixasRecomendadas: [3],
  },
  {
    id: 10,
    nome: "Agence Française de Développement (AFD)",
    natureza: "Agência pública francesa",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito e cooperação técnica",
    acesso: "direto",
    acessoNota: "Direto estruturado ou intermediado",
    estagio: "ambos",
    temas: ["infraestrutura_urbana", "saneamento_agua", "adaptacao_resiliencia"],
    temasNota: "Desenvolvimento urbano; clima; água; inclusão",
    abrangencia: "Nacional",
    faixa: "Definida por operação; histórico via BDMG",
    contrapartida: "Conforme operação",
    rotaAcesso: "AFD ou banco de desenvolvimento parceiro",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Média-Alta",
    prazo: "18–42 meses",
    exigencias: "Clima; inclusão; capacidade financeira; padrões socioambientais",
    fonte: "https://www.afd.fr/en/page-region-pays/brazil",
    faixasRecomendadas: [1, 3],
  },
  {
    id: 11,
    nome: "KfW Development Bank / GIZ",
    natureza: "Cooperação alemã",
    modalidades: ["credito", "assistencia_tecnica"],
    modalidadeNota: "Crédito concessional e assistência técnica",
    acesso: "intermediado",
    acessoNota: "Intermediado/programático",
    estagio: "ambos",
    temas: ["energia", "florestas_bioeconomia", "infraestrutura_urbana"],
    temasNota: "Energia; florestas; cidades; biodiversidade",
    abrangencia: "Nacional ou territórios definidos",
    faixa: "Definida por programa bilateral",
    contrapartida: "Conforme programa",
    rotaAcesso: "Cooperação bilateral + instituições executoras brasileiras",
    situacao: "programatico",
    situacaoNota: "Programático",
    prioridade: "Média",
    prazo: "18–36 meses",
    exigencias: "Alinhamento ao programa bilateral; parceiro executor",
    fonte:
      "https://www.kfw-entwicklungsbank.de/International-financing/KfW-Development-Bank/Local-presence/Latin-America-and-the-Caribbean/Brazil/",
    faixasRecomendadas: [0, 1],
  },
  {
    id: 12,
    nome: "International Climate Initiative (IKI)",
    natureza: "Governo da Alemanha",
    modalidades: ["doacao", "assistencia_tecnica"],
    modalidadeNota: "Doação e assistência técnica",
    acesso: "consorcio",
    acessoNota: "Consórcio/chamada",
    estagio: "ambos",
    temas: ["adaptacao_resiliencia", "florestas_bioeconomia", "infraestrutura_urbana"],
    temasNota: "Mitigação; adaptação; biodiversidade; cidades",
    abrangencia: "Brasil conforme chamada",
    faixa: "Country Call 2024: € 8–30 mi por projeto",
    contrapartida: "Parcerias e contribuição conforme chamada",
    rotaAcesso: "Consórcio liderado por organização elegível; município como parceiro",
    situacao: "chamada_encerrada",
    situacaoNota: "Chamadas periódicas; Country Call 2024 encerrada",
    prioridade: "Média-Alta para consórcios",
    prazo: "12–30 meses",
    exigencias: "Consórcio; impacto; replicabilidade; governança; clima/biodiversidade",
    fonte:
      "https://www.international-climate-initiative.com/en/find-funding/country-call/country-call-brazil/",
    faixasRecomendadas: [2],
  },
  {
    id: 13,
    nome: "Mitigation Action Facility",
    natureza: "Programa multi-doador",
    modalidades: ["doacao", "credito", "assistencia_tecnica"],
    modalidadeNota: "Doação, instrumentos concessional e TA",
    acesso: "consorcio",
    acessoNota: "Indireto/consórcio",
    estagio: "ambos",
    temas: ["energia", "mobilidade"],
    temasNota: "Energia; transporte; indústria; mecanismos financeiros",
    abrangencia: "Nacional; projetos podem incluir cidades",
    faixa: "Projetos anteriores na faixa de dezenas de milhões de EUR",
    contrapartida: "Alavancagem financeira esperada",
    rotaAcesso: "Parceiro de projeto elegível + governo/atores setoriais",
    situacao: "chamada_aberta",
    situacaoNota: "Chamada 2026 em andamento após fase de conceitos",
    prioridade: "Média",
    prazo: "18–36 meses",
    exigencias: "Transformação setorial; mitigação relevante; alavancagem; MRV",
    fonte: "https://mitigation-action.org/news-events/",
    faixasRecomendadas: [2],
  },
  {
    id: 14,
    nome: "City Climate Finance Gap Fund",
    natureza: "Multi-doador; BM/EIB",
    modalidades: ["assistencia_tecnica"],
    modalidadeNota: "Assistência técnica não reembolsável",
    acesso: "direto",
    acessoNota: "Direto para apoio técnico",
    estagio: "preparacao",
    temas: ["infraestrutura_urbana", "adaptacao_resiliencia"],
    temasNota: "Infraestrutura urbana de baixo carbono e resiliente",
    abrangencia: "Cidades elegíveis; já apoiou Campinas",
    faixa: "Não financia a obra; apoia preparação inicial",
    contrapartida: "Não necessariamente financeira",
    rotaAcesso: "Manifestação de interesse da cidade/entidade indicada",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Muito alta para projeto inicial",
    prazo: "6–18 meses",
    exigencias: "Compromisso municipal; potencial climático; projeto em estágio inicial",
    fonte: "https://www.citygapfund.org/",
    faixasRecomendadas: [0, 1],
  },
  {
    id: 15,
    nome: "C40 Cities Finance Facility (CFF)",
    natureza: "C40/GIZ e parceiros",
    modalidades: ["assistencia_tecnica"],
    modalidadeNota: "Assistência técnica",
    acesso: "direto",
    acessoNota: "Seleção competitiva",
    estagio: "preparacao",
    temas: ["mobilidade", "energia", "residuos", "adaptacao_resiliencia"],
    temasNota: "Mobilidade; energia; resíduos; adaptação urbana",
    abrangencia: "Cidades; histórico em Curitiba",
    faixa: "Não financia a obra; estrutura projeto e capacidade",
    contrapartida: "Compromisso e equipe municipal",
    rotaAcesso: "Chamada/seleção CFF e parceria com cidade",
    situacao: "programatico",
    situacaoNota: "Programático; verificar nova seleção",
    prioridade: "Alta para cidades elegíveis",
    prazo: "9–24 meses",
    exigencias: "Ambição climática; inclusão; escala; compromisso político",
    fonte: "https://c40cff.org/",
    faixasRecomendadas: [1],
  },
  {
    id: 16,
    nome: "CCFLA Brazil Local Hub",
    natureza: "Aliança internacional",
    modalidades: ["assistencia_tecnica"],
    modalidadeNota: "Apoio técnico e conexão financeira",
    acesso: "direto",
    acessoNota: "Direto/rede",
    estagio: "preparacao",
    temas: ["infraestrutura_urbana", "adaptacao_resiliencia"],
    temasNota: "Projetos urbanos resilientes e de baixo carbono",
    abrangencia: "Brasil",
    faixa: "Sem valor de obra; conexão e estruturação",
    contrapartida: "Compromisso municipal",
    rotaAcesso: "Hub, parceiros técnicos e chamadas/eventos",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Alta para formação de pipeline",
    prazo: "3–18 meses",
    exigencias: "Projeto climático local; dados; participação em pipeline",
    fonte: "https://citiesclimatefinance.org/brazil-hub",
    faixasRecomendadas: [0],
  },
  {
    id: 17,
    nome: "FONPLATA",
    natureza: "Banco multilateral regional",
    modalidades: ["credito"],
    modalidadeNota: "Crédito",
    acesso: "direto",
    acessoNota: "Direto ou intermediado",
    estagio: "investimento",
    temas: ["infraestrutura_urbana"],
    temasNota: "Infraestrutura sustentável; integração; cidades",
    abrangencia: "Nacional, com foco regional",
    faixa: "Definida por operação",
    contrapartida: "Contrapartida e rito fiscal",
    rotaAcesso: "Banco + COFIEX/garantia conforme estrutura",
    situacao: "ativo",
    situacaoNota: "Ativo",
    prioridade: "Média-Alta",
    prazo: "20–42 meses",
    exigencias: "Capacidade fiscal; escala; integração regional; salvaguardas",
    fonte: "https://www.fonplata.org/pt/",
    faixasRecomendadas: [3],
  },
  {
    id: 18,
    nome: "Linhas internacionais via bancos regionais (BRDE/BDMG)",
    natureza: "Intermediação nacional de NDB/EIB/AFD e outros",
    modalidades: ["credito"],
    modalidadeNota: "Crédito repassado",
    acesso: "intermediado",
    acessoNota: "Direto com banco regional",
    estagio: "investimento",
    temas: ["energia", "infraestrutura_urbana", "saneamento_agua"],
    temasNota: "Energia limpa; cidades; saneamento; infraestrutura",
    abrangencia: "Regiões/estados atendidos pelo banco",
    faixa: "Conforme linha e porte; atende projetos subnacionais",
    contrapartida: "Conforme linha",
    rotaAcesso:
      "Banco regional; em alguns casos sem contratação externa direta pelo município",
    situacao: "ativo",
    situacaoNota: "Ativo conforme linha",
    prioridade: "Muito alta para municípios pequenos/médios",
    prazo: "6–24 meses",
    exigencias: "Cadastro; capacidade de pagamento; projeto e garantias da linha",
    fonte:
      "https://www.ndb.int/project/bdmg-infrastructure-and-sustainable-development-financing-project/",
    faixasRecomendadas: [1],
  },
];

export const ATUALIZACAO_PESQUISA = "2026-08-07";

export const MODALIDADES: { value: Modalidade; label: string }[] = [
  { value: "doacao", label: "Doação" },
  { value: "credito", label: "Crédito" },
  { value: "assistencia_tecnica", label: "Assistência técnica" },
  { value: "garantia", label: "Garantia" },
];

export const ACESSOS: { value: Acesso; label: string }[] = [
  { value: "direto", label: "Direto" },
  { value: "indireto", label: "Indireto (via entidade)" },
  { value: "intermediado", label: "Intermediado" },
  { value: "consorcio", label: "Consórcio" },
];

export const SITUACOES_OPORTUNIDADE: { value: SituacaoOportunidade; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "programatico", label: "Programático" },
  { value: "chamada_aberta", label: "Chamada aberta" },
  { value: "chamada_encerrada", label: "Chamada encerrada" },
];

export interface FiltroOportunidades {
  modalidade?: Modalidade;
  acesso?: Acesso;
  tema?: string;
  situacao?: SituacaoOportunidade;
  /** Índice da faixa de prontidão (0 a 3) para marcar os canais recomendados. */
  faixa?: number;
}

export function filtrarOportunidades(f: FiltroOportunidades): Oportunidade[] {
  return OPORTUNIDADES.filter((o) => {
    if (f.modalidade && !o.modalidades.includes(f.modalidade)) return false;
    if (f.acesso && o.acesso !== f.acesso) return false;
    if (f.tema && !o.temas.includes(f.tema)) return false;
    if (f.situacao && o.situacao !== f.situacao) return false;
    return true;
  });
}

/**
 * Ordena colocando primeiro o que a matriz recomenda para a prontidão atual e,
 * dentro disso, o que combina com o tema do projeto. Chamadas encerradas vão
 * para o fim: a planilha as mantém como canal de monitoramento, não como
 * oportunidade aberta.
 */
export function ordenarPorAderencia(
  lista: Oportunidade[],
  faixa: number | undefined,
  tema: string | undefined,
): Oportunidade[] {
  const nota = (o: Oportunidade) => {
    let n = 0;
    if (faixa !== undefined && o.faixasRecomendadas.includes(faixa)) n -= 4;
    if (tema && o.temas.includes(tema)) n -= 2;
    if (o.situacao === "chamada_encerrada") n += 8;
    return n;
  };
  return [...lista].sort((a, b) => nota(a) - nota(b) || a.id - b.id);
}
