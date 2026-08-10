/**
 * Base comum dos cases de captação climática.
 *
 * Cada case é uma operação que existiu de verdade, carregada como projeto de
 * captação para a prefeitura ver o módulo com conteúdo real. O script do case
 * carrega os dados e a documentação da fonte; aqui fica só o encanamento.
 *
 * Regra que vale para todos: o que é fato tem fonte declarada no script do
 * case; o que é reconstrução (as respostas do diagnóstico e a situação dos
 * documentos) está marcado como tal, e as respostas que são dedução dizem isso
 * na própria evidência. Nenhum case deve ser lido como auditoria do que o
 * município fez.
 */

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../../../apps/gov/.env.local", import.meta.url), "utf8")
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

/** Pesos das 20 questões, na ordem — espelha QUESTOES em apps/gov/src/lib/financiamento.ts. */
const PESOS = [5, 7, 5, 6, 5, 6, 6, 5, 6, 5, 4, 4, 3, 5, 6, 5, 5, 4, 3, 4];

export async function api(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, { headers: H, ...opcoes });
  const corpo = await r.text();
  if (!r.ok) throw new Error(`${caminho} → ${r.status} ${corpo}`);
  return corpo ? JSON.parse(corpo) : null;
}

/**
 * @param {object} case_
 * @param {string} case_.nome            prefixado com [CASE] pelo chamador
 * @param {string} case_.descricao       separa fato de reconstrução, com fontes
 * @param {string} case_.tema
 * @param {number|null} case_.valorBrl
 * @param {string} case_.situacao
 * @param {[number, string, string][]} case_.respostas   [questaoId, resposta, evidência]
 * @param {[number, string, string][]} case_.documentos  [documentoId, situação, observação]
 */
export async function carregarCase(case_) {
  const [municipio] = await api("municipios?select=id,nome&limit=1");
  const [gestor] = await api("perfis?select=id&papel=eq.prefeitura_gestor&limit=1");
  if (!municipio || !gestor) throw new Error("Município ou gestor não encontrados.");

  // Idempotente: recarregar o case substitui em vez de empilhar cópias.
  const existentes = await api(
    `projetos_captacao?nome=eq.${encodeURIComponent(case_.nome)}&select=id`,
  );
  for (const p of existentes) {
    await api(`projetos_captacao?id=eq.${p.id}`, { method: "DELETE" });
  }

  const [projeto] = await api("projetos_captacao", {
    method: "POST",
    body: JSON.stringify({
      municipio_id: municipio.id,
      nome: case_.nome,
      descricao: case_.descricao,
      tema: case_.tema,
      valor_estimado_brl: case_.valorBrl ?? null,
      situacao: case_.situacao,
      criado_por: gestor.id,
    }),
  });

  await api("diagnostico_respostas", {
    method: "POST",
    body: JSON.stringify(
      case_.respostas.map(([questao_id, resposta, evidencia]) => ({
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
      case_.documentos.map(([documento_id, situacao, observacao]) => ({
        projeto_id: projeto.id,
        documento_id,
        situacao,
        observacao,
        atualizado_por: gestor.id,
      })),
    ),
  });

  const pontos = case_.respostas.reduce((s, [id, r]) => {
    const peso = PESOS[id - 1];
    return s + (r === "sim" ? peso : r === "parcial" ? peso / 2 : 0);
  }, 0);
  const prontos = case_.documentos.filter(([, s]) => s === "pronto").length;

  console.log(`case carregado em ${municipio.nome}`);
  console.log(`  projeto:     ${projeto.id}`);
  console.log(
    `  diagnóstico: ${pontos} de 99 pontos → ${Math.round((pontos / 99) * 100)}%`,
  );
  console.log(`  documentos:  ${prontos} prontos de ${case_.documentos.length} na rota`);

  return projeto;
}
