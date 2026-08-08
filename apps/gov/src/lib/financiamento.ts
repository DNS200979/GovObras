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
