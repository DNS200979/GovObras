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

import { criarDb } from "./db-neon.mjs";

/** Pesos das 20 questões, na ordem — espelha QUESTOES em apps/gov/src/lib/financiamento.ts. */
const PESOS = [5, 7, 5, 6, 5, 6, 6, 5, 6, 5, 4, 4, 3, 5, 6, 5, 5, 4, 3, 4];

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
  const db = await criarDb();
  try {
    return await carregar(db, case_);
  } finally {
    await db.fim();
  }
}

async function carregar(db, case_) {
  const orFalha = ({ data, error }, onde) => {
    if (error) throw new Error(`${onde}: ${error.message}`);
    return data;
  };

  // O RLS enxerga os projetos pelo município do perfil: o case entra no
  // município do gestor, não no "primeiro" da tabela (as migrações já carregam vários).
  const [gestor] = orFalha(
    await db.from("perfis").select("id, municipio_id").eq("papel", "prefeitura_gestor").limit(1),
    "perfis",
  );
  const municipio = gestor
    ? orFalha(await db.from("municipios").select("id, nome").eq("id", gestor.municipio_id).single(), "municipios")
    : null;
  if (!municipio || !gestor) throw new Error("Município ou gestor não encontrados.");

  // Idempotente: recarregar o case substitui em vez de empilhar cópias.
  const existentes = orFalha(
    await db.from("projetos_captacao").select("id").eq("nome", case_.nome),
    "projetos_captacao",
  );
  for (const p of existentes) {
    orFalha(await db.from("projetos_captacao").delete().eq("id", p.id), "delete projeto");
  }

  const projeto = orFalha(
    await db
      .from("projetos_captacao")
      .insert({
        municipio_id: municipio.id,
        nome: case_.nome,
        descricao: case_.descricao,
        tema: case_.tema,
        valor_estimado_brl: case_.valorBrl ?? null,
        situacao: case_.situacao,
        criado_por: gestor.id,
      })
      .select("*")
      .single(),
    "projeto",
  );

  orFalha(
    await db.from("diagnostico_respostas").insert(
      case_.respostas.map(([questao_id, resposta, evidencia]) => ({
        projeto_id: projeto.id,
        questao_id,
        resposta,
        evidencia,
        origem: "manual",
        respondido_por: gestor.id,
      })),
    ),
    "diagnostico_respostas",
  );

  orFalha(
    await db.from("projeto_documentos").insert(
      case_.documentos.map(([documento_id, situacao, observacao]) => ({
        projeto_id: projeto.id,
        documento_id,
        situacao,
        observacao,
        atualizado_por: gestor.id,
      })),
    ),
    "projeto_documentos",
  );

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
