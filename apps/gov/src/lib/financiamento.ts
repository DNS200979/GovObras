/**
 * Matriz de Financiamento Climático Municipal.
 *
 * Metodologia transcrita da planilha de referência: 20 questões com peso
 * (99 pontos no total), e as faixas de prontidão que definem a rota de
 * captação e os canais recomendados.
 *
 * Fica em código, e não no banco, porque é metodologia versionada — muda por
 * revisão da matriz, não por operação do usuário.
 */

export type Resposta = "sim" | "parcial" | "nao";

export interface Questao {
  id: number;
  dimensao: string;
  pergunta: string;
  peso: number;
  proximaAcao: string;
}

export const QUESTOES: Questao[] = [
  { id: 1, dimensao: "Governança", peso: 5, pergunta: "Existe coordenador formal e equipe intersecretarial?", proximaAcao: "Publicar portaria e definir responsável" },
  { id: 2, dimensao: "Estratégia", peso: 7, pergunta: "Existe plano municipal climático aprovado ou em elaboração avançada?", proximaAcao: "Elaborar/atualizar plano de mitigação e adaptação" },
  { id: 3, dimensao: "Dados", peso: 5, pergunta: "Existe inventário municipal de GEE com metodologia e ano-base?", proximaAcao: "Produzir inventário compatível com GPC" },
  { id: 4, dimensao: "Risco", peso: 6, pergunta: "Existe mapa de riscos e vulnerabilidade climática atualizado?", proximaAcao: "Mapear ameaças, exposição e vulnerabilidade" },
  { id: 5, dimensao: "Priorização", peso: 5, pergunta: "O projeto está priorizado no PPA e nos planos setoriais?", proximaAcao: "Formalizar prioridade e vínculo orçamentário" },
  { id: 6, dimensao: "Escopo", peso: 6, pergunta: "O problema, solução, beneficiários e componentes estão definidos?", proximaAcao: "Preparar nota conceitual" },
  { id: 7, dimensao: "Clima", peso: 6, pergunta: "A adicionalidade climática e os resultados são quantificados?", proximaAcao: "Calcular emissões evitadas ou risco reduzido" },
  { id: 8, dimensao: "Custos", peso: 5, pergunta: "Há orçamento preliminar com CAPEX, OPEX e contingência?", proximaAcao: "Elaborar estimativa e custo do ciclo de vida" },
  { id: 9, dimensao: "Técnico", peso: 6, pergunta: "Existe pré-viabilidade ou estudo de alternativas?", proximaAcao: "Contratar/realizar pré-viabilidade" },
  { id: 10, dimensao: "Ambiental", peso: 5, pergunta: "Licenciamento e salvaguardas foram mapeados?", proximaAcao: "Preparar estratégia ambiental e social" },
  { id: 11, dimensao: "Fundiário", peso: 4, pergunta: "Áreas, matrículas, servidões e desapropriações estão mapeadas?", proximaAcao: "Realizar diagnóstico fundiário" },
  { id: 12, dimensao: "Social", peso: 4, pergunta: "Comunidades afetadas foram identificadas e consultadas?", proximaAcao: "Planejar participação e mecanismo de queixas" },
  { id: 13, dimensao: "Inclusão", peso: 3, pergunta: "Há abordagem de gênero e grupos vulneráveis?", proximaAcao: "Criar indicadores inclusivos" },
  { id: 14, dimensao: "Resultados", peso: 5, pergunta: "Existe matriz de resultados, linha de base e MRV?", proximaAcao: "Definir indicadores, metas e fontes" },
  { id: 15, dimensao: "Fiscal", peso: 6, pergunta: "A prefeitura conhece sua CAPAG e margem de endividamento?", proximaAcao: "Executar pré-diagnóstico fiscal" },
  { id: 16, dimensao: "Contrapartida", peso: 5, pergunta: "Há fonte de contrapartida financeira ou não financeira?", proximaAcao: "Reservar contrapartida no orçamento" },
  { id: 17, dimensao: "Operação", peso: 5, pergunta: "Há plano e recursos para operação e manutenção pós-projeto?", proximaAcao: "Definir custeio e responsável operacional" },
  { id: 18, dimensao: "Execução", peso: 4, pergunta: "A prefeitura possui ou consegue formar uma UGP?", proximaAcao: "Desenhar unidade de gerenciamento" },
  { id: 19, dimensao: "Aquisições", peso: 3, pergunta: "A equipe conhece regras de licitação do financiador?", proximaAcao: "Planejar capacitação e aquisições" },
  { id: 20, dimensao: "Parcerias", peso: 4, pergunta: "Há diálogo inicial com financiador, agência ou parceiro técnico?", proximaAcao: "Preparar abordagem e reunião de enquadramento" },
];

export const PONTOS_POSSIVEIS = QUESTOES.reduce((s, q) => s + q.peso, 0); // 99

/** Resposta parcial vale metade do peso, conforme a planilha. */
export function pontosDaResposta(peso: number, resposta: Resposta): number {
  if (resposta === "sim") return peso;
  if (resposta === "parcial") return peso / 2;
  return 0;
}

export interface Faixa {
  min: number;
  max: number;
  prioridade: string;
  canais: string;
}

export const FAIXAS: Faixa[] = [
  {
    min: 0,
    max: 39,
    prioridade: "Preparar base institucional",
    canais: "Gap Fund, CCFLA Hub, assistência técnica e planos climáticos",
  },
  {
    min: 40,
    max: 59,
    prioridade: "Pré-viabilidade e documentos",
    canais: "C40 CFF, Gap Fund, cooperação técnica, bancos regionais",
  },
  {
    min: 60,
    max: 79,
    prioridade: "Estruturar proposta e parceiro",
    canais: "Fundo Amazônia se elegível, GCF/GEF via entidade, IKI/MAF via consórcio",
  },
  {
    min: 80,
    max: 100,
    prioridade: "Negociar financiamento",
    canais: "BID, CAF, NDB, Banco Mundial, FONPLATA; iniciar COFIEX se crédito externo",
  },
];

export function faixaDaProntidao(prontidaoPct: number): Faixa {
  return FAIXAS.find((f) => prontidaoPct >= f.min && prontidaoPct <= f.max) ?? FAIXAS[0];
}

/** Classificação curta, como na planilha ("Estágio inicial" com 0 ponto). */
export function classificacao(prontidaoPct: number): string {
  if (prontidaoPct < 40) return "Estágio inicial";
  if (prontidaoPct < 60) return "Em estruturação";
  if (prontidaoPct < 80) return "Avançado";
  return "Pronto para negociar";
}

export interface ResultadoDiagnostico {
  pontosObtidos: number;
  pontosPossiveis: number;
  prontidaoPct: number;
  classificacao: string;
  faixa: Faixa;
  respondidas: number;
  lacunas: Questao[];
}

export function calcularDiagnostico(respostas: Map<number, Resposta>): ResultadoDiagnostico {
  let pontos = 0;
  const lacunas: Questao[] = [];

  for (const q of QUESTOES) {
    const r = respostas.get(q.id);
    if (!r) continue;
    pontos += pontosDaResposta(q.peso, r);
    if (r !== "sim") lacunas.push(q);
  }

  // A prontidão é sobre o total possível: questão não respondida pesa como
  // lacuna, senão um diagnóstico pela metade pareceria melhor do que é.
  const pct = Math.round((pontos / PONTOS_POSSIVEIS) * 100);

  return {
    pontosObtidos: pontos,
    pontosPossiveis: PONTOS_POSSIVEIS,
    prontidaoPct: pct,
    classificacao: classificacao(pct),
    faixa: faixaDaProntidao(pct),
    respondidas: [...respostas.keys()].length,
    // as maiores lacunas primeiro: é onde a pontuação mais cresce
    lacunas: lacunas.sort((a, b) => b.peso - a.peso),
  };
}

export const TEMAS: { value: string; label: string }[] = [
  { value: "adaptacao_resiliencia", label: "Adaptação e resiliência" },
  { value: "mobilidade", label: "Mobilidade" },
  { value: "saneamento_agua", label: "Saneamento e água" },
  { value: "residuos", label: "Resíduos" },
  { value: "energia", label: "Energia" },
  { value: "drenagem", label: "Drenagem" },
  { value: "florestas_bioeconomia", label: "Florestas e bioeconomia" },
  { value: "infraestrutura_urbana", label: "Infraestrutura urbana" },
];

export const SITUACOES: { value: string; label: string }[] = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "preparacao", label: "Preparação" },
  { value: "negociacao", label: "Negociação" },
  { value: "contratado", label: "Contratado" },
  { value: "arquivado", label: "Arquivado" },
];

// ============================================================
// Matriz documental por rota de captação
// ============================================================

export type Rota = "doacao" | "assistencia_tecnica" | "credito_externo";

/**
 * Exigência de um documento numa rota. A planilha usa rótulos livres
 * ("Sim", "Conforme edital", "Pode ser produto"…); aqui eles viram três
 * níveis para o filtro funcionar, guardando o rótulo original como nota,
 * porque a diferença entre "obrigatório" e "conforme edital" muda o que a
 * prefeitura faz na prática.
 */
export type Nivel = "exigido" | "conforme" | "nao_se_aplica";

export interface ExigenciaRota {
  nivel: Nivel;
  nota: string;
}

export interface DocumentoMatriz {
  id: number;
  documento: string;
  doacao: ExigenciaRota;
  assistenciaTecnica: ExigenciaRota;
  creditoExterno: ExigenciaRota;
  prioridade: string;
  responsavel: string;
  observacao: string;
}

const ex = (nivel: Nivel, nota: string): ExigenciaRota => ({ nivel, nota });
const SIM = ex("exigido", "Sim");
const NAO = ex("nao_se_aplica", "Não");
const ALTA = ex("exigido", "Alta");
const DES = ex("conforme", "Desejável");
const PRE = ex("conforme", "Preliminar");

export const DOCUMENTOS: DocumentoMatriz[] = [
  { id: 1, documento: "Ofício de manifestação de interesse", doacao: SIM, assistenciaTecnica: SIM, creditoExterno: SIM, prioridade: "Obrigatório", responsavel: "Gabinete/Planejamento", observacao: "Registrar autoridade signatária e protocolo" },
  { id: 2, documento: "Lei municipal autorizativa", doacao: ex("conforme", "Conforme edital"), assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Obrigatório no crédito", responsavel: "Procuradoria/Câmara", observacao: "Controlar número, publicação e vigência" },
  { id: 3, documento: "PPA, LDO e LOA com projeto/contrapartida", doacao: SIM, assistenciaTecnica: DES, creditoExterno: SIM, prioridade: "Obrigatório", responsavel: "Planejamento/Fazenda", observacao: "Validar exercício e rubrica" },
  { id: 4, documento: "CAPAG e prévia fiscal", doacao: NAO, assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Fazenda", observacao: "Consultar situação e registrar data" },
  { id: 5, documento: "Limites de endividamento e garantias", doacao: NAO, assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Fazenda", observacao: "Checklist LRF/STN" },
  { id: 6, documento: "Inventário municipal de GEE", doacao: DES, assistenciaTecnica: DES, creditoExterno: DES, prioridade: "Alta", responsavel: "Meio Ambiente", observacao: "Metodologia, ano-base e escopos" },
  { id: 7, documento: "Plano municipal de mitigação/adaptação", doacao: ALTA, assistenciaTecnica: ALTA, creditoExterno: ALTA, prioridade: "Alta", responsavel: "Meio Ambiente/Planejamento", observacao: "Relacionar metas e ações" },
  { id: 8, documento: "Mapa de riscos e vulnerabilidade climática", doacao: ALTA, assistenciaTecnica: ALTA, creditoExterno: ALTA, prioridade: "Alta", responsavel: "Defesa Civil/Planejamento", observacao: "Camadas geográficas e população exposta" },
  { id: 9, documento: "Nota conceitual do projeto", doacao: SIM, assistenciaTecnica: SIM, creditoExterno: SIM, prioridade: "Obrigatório", responsavel: "Equipe do projeto", observacao: "Problema, solução, custos e resultados" },
  { id: 10, documento: "Estudo de pré-viabilidade", doacao: DES, assistenciaTecnica: ex("conforme", "Pode ser produto"), creditoExterno: SIM, prioridade: "Alta", responsavel: "Infraestrutura/Consultoria", observacao: "Alternativas, demanda e custos" },
  { id: 11, documento: "Estudo de viabilidade técnico-econômica", doacao: ex("conforme", "Conforme fundo"), assistenciaTecnica: ex("conforme", "Pode ser produto"), creditoExterno: SIM, prioridade: "Crítico", responsavel: "Infraestrutura/Fazenda", observacao: "VPL/TIR quando aplicável e custo do ciclo de vida" },
  { id: 12, documento: "Projeto básico/executivo", doacao: ex("conforme", "Conforme estágio"), assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Alta", responsavel: "Infraestrutura", observacao: "Versão, ART/RRT e orçamento" },
  { id: 13, documento: "Orçamento detalhado e cronograma físico-financeiro", doacao: SIM, assistenciaTecnica: PRE, creditoExterno: SIM, prioridade: "Obrigatório", responsavel: "Infraestrutura/Fazenda", observacao: "Moeda, câmbio, contingência e data-base" },
  { id: 14, documento: "Plano de aquisições", doacao: SIM, assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Alta", responsavel: "Licitações/UGP", observacao: "Regras nacionais e do financiador" },
  { id: 15, documento: "Licenças e estratégia de licenciamento", doacao: SIM, assistenciaTecnica: PRE, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Meio Ambiente", observacao: "Órgão, fase, condicionantes e validade" },
  { id: 16, documento: "Situação fundiária e dominial", doacao: SIM, assistenciaTecnica: PRE, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Patrimônio/Procuradoria", observacao: "Matrículas, desapropriações e servidões" },
  { id: 17, documento: "Avaliação ambiental e social / salvaguardas", doacao: SIM, assistenciaTecnica: PRE, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Meio Ambiente/Social", observacao: "Padrão do financiador e plano de gestão" },
  { id: 18, documento: "Consulta e participação social", doacao: SIM, assistenciaTecnica: DES, creditoExterno: SIM, prioridade: "Alta", responsavel: "Social/Gabinete", observacao: "Públicos afetados, atas e respostas" },
  { id: 19, documento: "Plano de gênero e inclusão", doacao: ex("conforme", "Frequente"), assistenciaTecnica: DES, creditoExterno: ex("conforme", "Frequente"), prioridade: "Alta", responsavel: "Social/Planejamento", observacao: "Indicadores desagregados" },
  { id: 20, documento: "Matriz de resultados e MRV", doacao: SIM, assistenciaTecnica: SIM, creditoExterno: SIM, prioridade: "Obrigatório", responsavel: "Meio Ambiente/UGP", observacao: "Linha de base, metas, fontes e frequência" },
  { id: 21, documento: "Cálculo de emissões evitadas/adaptação", doacao: SIM, assistenciaTecnica: SIM, creditoExterno: DES, prioridade: "Alta", responsavel: "Meio Ambiente", observacao: "Premissas, fatores e metodologia" },
  { id: 22, documento: "Plano de operação e manutenção", doacao: SIM, assistenciaTecnica: DES, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Secretaria executora", observacao: "Custos e fonte após implantação" },
  { id: 23, documento: "Estrutura e regimento da UGP", doacao: DES, assistenciaTecnica: DES, creditoExterno: SIM, prioridade: "Alta", responsavel: "Gabinete/Planejamento", observacao: "Papéis, equipe e dedicação" },
  { id: 24, documento: "Certidões e regularidade do ente", doacao: ex("conforme", "Conforme fundo"), assistenciaTecnica: NAO, creditoExterno: SIM, prioridade: "Crítico", responsavel: "Fazenda/Procuradoria", observacao: "Validade e pendências" },
  { id: 25, documento: "Carta de cofinanciamento/contrapartida", doacao: SIM, assistenciaTecnica: DES, creditoExterno: SIM, prioridade: "Alta", responsavel: "Fazenda/Parceiros", observacao: "Valor, fonte, condição e prazo" },
];

export const ROTAS: { value: Rota; label: string; descricao: string }[] = [
  {
    value: "doacao",
    label: "Doação / fundo",
    descricao: "Recurso não reembolsável — Fundo Amazônia, GCF, GEF, IKI",
  },
  {
    value: "assistencia_tecnica",
    label: "Assistência técnica",
    descricao: "Prepara o projeto para ser financiável; não paga a obra",
  },
  {
    value: "credito_externo",
    label: "Crédito externo",
    descricao: "BID, CAF, NDB, Banco Mundial — exige COFIEX e rito fiscal",
  },
];

export function exigenciaNaRota(doc: DocumentoMatriz, rota: Rota): ExigenciaRota {
  if (rota === "doacao") return doc.doacao;
  if (rota === "assistencia_tecnica") return doc.assistenciaTecnica;
  return doc.creditoExterno;
}

/** Documentos que a rota pede, do mais crítico para o menos. */
export function documentosDaRota(rota: Rota): DocumentoMatriz[] {
  const ordem: Record<string, number> = {
    Crítico: 0,
    Obrigatório: 1,
    "Obrigatório no crédito": 1,
    Alta: 2,
  };
  return DOCUMENTOS.filter((d) => exigenciaNaRota(d, rota).nivel !== "nao_se_aplica").sort(
    (a, b) => (ordem[a.prioridade] ?? 3) - (ordem[b.prioridade] ?? 3) || a.id - b.id,
  );
}

export type SituacaoDoc = "pendente" | "em_elaboracao" | "pronto" | "nao_aplicavel";

export const SITUACOES_DOC: { value: SituacaoDoc; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "pronto", label: "Pronto" },
  { value: "nao_aplicavel", label: "Não se aplica" },
];

export interface ProgressoDocumental {
  total: number;
  prontos: number;
  emElaboracao: number;
  pendentes: number;
  /** Não conta os marcados como não aplicáveis — senão o denominador mente. */
  percentual: number;
  criticosPendentes: DocumentoMatriz[];
}

export function progressoDocumental(
  rota: Rota,
  situacoes: Map<number, SituacaoDoc>,
): ProgressoDocumental {
  const docs = documentosDaRota(rota);
  const aplicaveis = docs.filter((d) => situacoes.get(d.id) !== "nao_aplicavel");
  const prontos = aplicaveis.filter((d) => situacoes.get(d.id) === "pronto").length;
  const emElaboracao = aplicaveis.filter((d) => situacoes.get(d.id) === "em_elaboracao").length;

  return {
    total: aplicaveis.length,
    prontos,
    emElaboracao,
    pendentes: aplicaveis.length - prontos - emElaboracao,
    percentual: aplicaveis.length === 0 ? 0 : Math.round((prontos / aplicaveis.length) * 100),
    criticosPendentes: aplicaveis.filter(
      (d) =>
        (d.prioridade === "Crítico" || d.prioridade.startsWith("Obrigatório")) &&
        situacoes.get(d.id) !== "pronto",
    ),
  };
}
