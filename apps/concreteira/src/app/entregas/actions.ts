"use server";

import { createHash } from "node:crypto";
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

  // Composição declarada em linhas dinâmicas (insumo/quantidade/unidade/fator) —
  // linha incompleta é ignorada em vez de barrar a entrega inteira.
  const insumos = formData.getAll("insumo").map((v) => v.toString().trim());
  const quantidades = formData.getAll("quantidade").map((v) => v.toString().replace(",", "."));
  const unidades = formData.getAll("unidade").map((v) => v.toString().trim());
  const fatorIds = formData.getAll("fator_id").map((v) => v.toString().trim());

  const linhas = insumos
    .map((insumo, i) => ({
      entrega_id: entrega.id,
      insumo,
      quantidade: Number(quantidades[i]),
      unidade: unidades[i] ?? "",
      fator_id: fatorIds[i] || null,
    }))
    .filter((l) => l.insumo && l.unidade && Number.isFinite(l.quantidade) && l.quantidade > 0);

  if (linhas.length > 0) {
    const { error: compErr } = await db.from("entrega_composicao").insert(linhas);
    if (compErr) {
      return { error: "Entrega registrada, mas houve um erro ao salvar a composição: " + compErr.message };
    }
  }

  // Evidência (NF-e/CT-e) — opcional aqui, mas sem ela a entrega não pode
  // ser materializada depois (lancamentos exige evidencia_id não nulo).
  // O arquivo em si sobe pela sessão da concreteira (tem policy própria);
  // a linha em `evidencias` só é gravável via client admin — essa tabela
  // não tem NENHUMA policy de INSERT, de propósito (ver migration 27).
  const arquivo = formData.get("evidencia_arquivo");
  if (arquivo instanceof File && arquivo.size > 0) {
    const tipo = formData.get("evidencia_tipo")?.toString() === "cte" ? "cte" : "nfe";
    const caminho = `${sessao.concreteiraId}/${entrega.id}/${Date.now()}-${arquivo.name}`;

    const { error: uploadErr } = await db.storage
      .from("entregas-concreto-docs")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });

    if (uploadErr) {
      return { error: "Entrega registrada, mas o envio do documento falhou: " + uploadErr.message };
    }

    const hash = createHash("sha256").update(Buffer.from(await arquivo.arrayBuffer())).digest("hex");

    // Migration 31 deu à concreteira INSERT em `evidencias` restrito às obras
    // em que ela está vinculada — não precisa mais de service role.
    const { data: evidencia, error: evErr } = await db
      .from("evidencias")
      .insert({
        obra_id: vinculo.obra_id,
        tipo,
        hash_sha256: hash,
        storage_path: caminho,
        status_validacao: "pendente",
      })
      .select("id")
      .single();

    if (evErr) {
      await db.storage.from("entregas-concreto-docs").remove([caminho]);
      return { error: "Entrega registrada, mas não foi possível gravar a evidência: " + evErr.message };
    }

    const { error: linkErr } = await db
      .from("entregas_concreto")
      .update({ evidencia_id: evidencia.id })
      .eq("id", entrega.id);
    if (linkErr) {
      return { error: "Entrega registrada, mas não foi possível vincular a evidência: " + linkErr.message };
    }
  }

  revalidatePath("/entregas");
  redirect(`/entregas/${entrega.id}`);
}
