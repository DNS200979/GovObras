/**
 * Dados de exemplo para o dashboard, no mesmo formato que virá do Supabase.
 * Substituir por queries reais (@carbonfree/database) quando o projeto for provisionado.
 */

export const kpis = {
  obrasAtivas: 47,
  dossiesPendentes: 9,
  selosEmitidos: 22,
  intensidadeMediaKgM2: 214,
};

export const balancoMunicipal = { passivo: 84_620, ativo: 31_180 };

export const serieIntensidade = [
  { mes: "Jan", intensidade: 248 },
  { mes: "Fev", intensidade: 241 },
  { mes: "Mar", intensidade: 236 },
  { mes: "Abr", intensidade: 233 },
  { mes: "Mai", intensidade: 227 },
  { mes: "Jun", intensidade: 221 },
  { mes: "Jul", intensidade: 214 },
];

export const distribuicaoFaixas = [
  { faixa: "AAA", obras: 4, tone: "ativo" as const },
  { faixa: "AA", obras: 9, tone: "ativo" as const },
  { faixa: "A", obras: 14, tone: "neutro" as const },
  { faixa: "B", obras: 12, tone: "neutro" as const },
  { faixa: "C", obras: 8, tone: "passivo" as const },
];

export const mesaAnalise = [
  {
    id: "OBR-1042",
    obra: "Residencial Vista Verde",
    construtora: "Andrade Incorporações",
    intensidade: 187,
    risco: "baixo" as const,
    prazo: "3 dias",
    status: "em_analise" as const,
  },
  {
    id: "OBR-0981",
    obra: "Edifício Corporate Tower",
    construtora: "BF Engenharia",
    intensidade: 296,
    risco: "alto" as const,
    prazo: "vencido",
    status: "pendencia" as const,
  },
  {
    id: "OBR-1103",
    obra: "Condomínio Bosque Real",
    construtora: "Andrade Incorporações",
    intensidade: 205,
    risco: "medio" as const,
    prazo: "7 dias",
    status: "em_analise" as const,
  },
  {
    id: "OBR-0877",
    obra: "Galpão Logístico Norte",
    construtora: "Sul Construções",
    intensidade: 342,
    risco: "alto" as const,
    prazo: "1 dia",
    status: "pendencia" as const,
  },
  {
    id: "OBR-1150",
    obra: "Residencial Mirante",
    construtora: "3C Construtora",
    intensidade: 164,
    risco: "baixo" as const,
    prazo: "12 dias",
    status: "protocolado" as const,
  },
];

export const statusLabel: Record<string, string> = {
  em_analise: "Em análise",
  pendencia: "Pendência",
  protocolado: "Protocolado",
};

export const riscoTone: Record<string, "ativo" | "neutro" | "passivo"> = {
  baixo: "ativo",
  medio: "neutro",
  alto: "passivo",
};
