import { createServerSupabase } from "@carbonfree/database/server";
import type { Resposta } from "./financiamento";

/**
 * Pré-preenchimento do diagnóstico a partir do que a plataforma já sabe.
 *
 * Só cobre as questões em que existe evidência concreta no banco — o resto
 * continua sendo pergunta. Cada sugestão vem com a evidência que a originou,
 * e a prefeitura pode sobrescrever (a resposta então passa a 'manual').
 *
 * Deliberadamente conservador: na dúvida sugere "parcial", nunca "sim".
 */
export interface Sugestao {
  questaoId: number;
  resposta: Resposta;
  evidencia: string;
}

export async function sugestoesDoDiagnostico(): Promise<Sugestao[]> {
  const db = await createServerSupabase();
  const sugestoes: Sugestao[] = [];

  const [{ data: inventarios }, { count: requisitos }, { data: selos }] = await Promise.all([
    db.from("inventarios").select("id, versao, status, obra_id"),
    db.from("requisitos_auditoria").select("*", { count: "exact", head: true }),
    db.from("selos").select("id"),
  ]);

  const totalInventarios = inventarios?.length ?? 0;
  const homologados = inventarios?.filter((i) => i.status === "homologado").length ?? 0;
  const obrasComInventario = new Set(inventarios?.map((i) => i.obra_id)).size;

  // Q3 — inventário de GEE com metodologia e ano-base.
  // A plataforma escritura inventários por obra (ISO 14064-1 / EN 15978).
  // Isso não é o inventário municipal completo no padrão GPC, então o teto
  // aqui é "parcial", por mais inventários que existam.
  if (totalInventarios > 0) {
    sugestoes.push({
      questaoId: 3,
      resposta: "parcial",
      evidencia: `${totalInventarios} inventário(s) de obra escriturado(s) na plataforma, ${homologados} homologado(s). Cobre o setor de construção; o inventário municipal no padrão GPC abrange todos os setores.`,
    });
  }

  // Q7 — adicionalidade climática quantificada.
  // Os lançamentos de natureza "ativo" são exatamente emissões evitadas ou
  // removidas, com evidência e fator vinculados.
  const { data: ativos } = await db
    .from("lancamentos")
    .select("tco2e")
    .eq("natureza", "ativo");
  const totalEvitado = (ativos ?? []).reduce((s, l) => s + Number(l.tco2e), 0);
  if (totalEvitado > 0) {
    sugestoes.push({
      questaoId: 7,
      resposta: "sim",
      evidencia: `${totalEvitado.toLocaleString("pt-BR")} tCO₂e de remoções/reduções escrituradas com evidência e fator de emissão vinculados.`,
    });
  }

  // Q14 — matriz de resultados, linha de base e MRV.
  // Requisitos auditáveis são a matriz; versões sucessivas de inventário são
  // a linha de base e o acompanhamento.
  const temSerie = (inventarios ?? []).some((i) => i.versao > 1);
  if ((requisitos ?? 0) > 0 && totalInventarios > 0) {
    sugestoes.push({
      questaoId: 14,
      resposta: temSerie ? "sim" : "parcial",
      evidencia: `${requisitos} requisito(s) auditável(is) definido(s) com evidência primária e teste de verificação${
        temSerie
          ? ", e inventários com mais de uma versão dando linha de base e série histórica."
          : ". Falta série histórica: os inventários ainda estão na primeira versão."
      }`,
    });
  }

  // Q10 — licenciamento e salvaguardas mapeados.
  // Documentos de obra incluem licença ambiental; só sugere se houver de fato.
  const { count: licencas } = await db
    .from("obra_documentos")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "licenca_ambiental");
  if ((licencas ?? 0) > 0) {
    sugestoes.push({
      questaoId: 10,
      resposta: "parcial",
      evidencia: `${licencas} licença(s) ambiental(is) anexada(s) às obras. Salvaguardas no padrão do financiador (ambiental e social) ainda precisam ser avaliadas à parte.`,
    });
  }

  // Q5 — prioridade e vínculo orçamentário: selo homologado é decisão formal
  // da prefeitura sobre a obra, mas não substitui PPA/LOA.
  if ((selos?.length ?? 0) > 0 && obrasComInventario > 0) {
    sugestoes.push({
      questaoId: 5,
      resposta: "parcial",
      evidencia: `${selos!.length} selo(s) homologado(s) pela prefeitura. Comprova priorização institucional, mas o vínculo com PPA/LDO/LOA precisa ser confirmado no orçamento.`,
    });
  }

  return sugestoes;
}
