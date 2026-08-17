"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConcreteira } from "@/lib/sessao";

export interface CriarEntregaState {
  error?: string;
}

export async function criarEntrega(
  _prev: CriarEntregaState,
  formData: FormData,
): Promise<CriarEntregaState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConcreteira(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const vinculoId = formData.get("obra_concreteira_id")?.toString();
  const volumeStr = formData.get("volume_m3")?.toString().replace(",", ".");
  const traco = formData.get("traco")?.toString().trim() || null;
  const dataEntrega = formData.get("data_entrega")?.toString();

  if (!vinculoId || !volumeStr || !dataEntrega) {
    return { error: "Preencha a obra, o volume e a data da entrega." };
  }

  const volume = Number(volumeStr);
  if (!Number.isFinite(volume) || volume <= 0) {
    return { error: "Volume inválido." };
  }

  const { data: vinculo, error: vincErr } = await db
    .from("obra_concreteiras")
    .select("obra_id")
    .eq("id", vinculoId)
    .single();
  if (vincErr || !vinculo) return { error: "Vínculo com a obra não encontrado." };

  const { data: entrega, error } = await db
    .from("entregas_concreto")
    .insert({
      obra_concreteira_id: vinculoId,
      obra_id: vinculo.obra_id,
      concreteira_id: sessao.concreteiraId,
      volume_m3: volume,
      traco,
      data_entrega: dataEntrega,
      criado_por: sessao.userId,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível registrar a entrega: " + error.message };

  // Composição declarada em linhas dinâmicas (insumo/quantidade/unidade) —
  // linha incompleta é ignorada em vez de barrar a entrega inteira.
  const insumos = formData.getAll("insumo").map((v) => v.toString().trim());
  const quantidades = formData.getAll("quantidade").map((v) => v.toString().replace(",", "."));
  const unidades = formData.getAll("unidade").map((v) => v.toString().trim());

  const linhas = insumos
    .map((insumo, i) => ({
      entrega_id: entrega.id,
      insumo,
      quantidade: Number(quantidades[i]),
      unidade: unidades[i] ?? "",
    }))
    .filter((l) => l.insumo && l.unidade && Number.isFinite(l.quantidade) && l.quantidade > 0);

  if (linhas.length > 0) {
    const { error: compErr } = await db.from("entrega_composicao").insert(linhas);
    if (compErr) {
      return { error: "Entrega registrada, mas houve um erro ao salvar a composição: " + compErr.message };
    }
  }

  revalidatePath("/entregas");
  redirect(`/entregas/${entrega.id}`);
}
