/** Lista e detalhe de obra licenciada. */
import { obrasComInventarioAtual } from "./_compartilhado";

export async function getObrasList() {
  return obrasComInventarioAtual();
}

export type ObraDetalhe = Awaited<ReturnType<typeof obrasComInventarioAtual>>[number];

/** Reaproveita a mesma consulta da listagem — não é o caminho mais eficiente, mas evita duplicar o join com inventário/lançamentos só pra uma tela que não é hot path. */
export async function getObraDetalhe(id: string): Promise<ObraDetalhe | null> {
  const obras = await obrasComInventarioAtual();
  return obras.find((o) => o.obraId === id) ?? null;
}
