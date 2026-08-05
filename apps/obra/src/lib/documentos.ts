/**
 * Constantes de documentos da obra — em módulo próprio porque são usadas
 * tanto em Client Components quanto no servidor; se ficassem em queries.ts,
 * o cliente puxaria junto o cliente Supabase de servidor (`next/headers`).
 */

export const tipoDocumentoLabel: Record<string, string> = {
  alvara: "Alvará de construção",
  projeto_aprovado: "Projeto aprovado",
  art_rrt: "ART / RRT",
  licenca_ambiental: "Licença ambiental",
  matricula: "Matrícula do imóvel",
  cno: "CNO / CEI",
  outro: "Outro",
};

/** O que a prefeitura espera no cadastro — usado para indicar o que falta. */
export const DOCUMENTOS_ESPERADOS = ["alvara", "projeto_aprovado", "art_rrt"];
