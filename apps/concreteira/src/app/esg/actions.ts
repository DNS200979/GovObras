"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConcreteira } from "@/lib/sessao";

export interface CriarItemEsgState {
  error?: string;
}

export async function criarItemEsg(
  _prev: CriarItemEsgState,
  formData: FormData,
): Promise<CriarItemEsgState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConcreteira(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const titulo = formData.get("titulo")?.toString().trim();
  const descricao = formData.get("descricao")?.toString().trim();
  const categoria = formData.get("categoria")?.toString();

  if (!titulo || !descricao || !categoria) {
    return { error: "Preencha todos os campos." };
  }

  const { data, error } = await db
    .from("concreteira_esg")
    .insert({
      concreteira_id: sessao.concreteiraId,
      titulo,
      descricao,
      categoria,
      criado_por: sessao.userId,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível criar o item: " + error.message };

  redirect(`/esg/${data.id}`);
}

export async function publicarItem(itemId: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("concreteira_esg").update({ status: "publicado" }).eq("id", itemId);
  if (error) throw error;
  revalidatePath(`/esg/${itemId}`);
  revalidatePath("/esg");
}

export async function despublicarItem(itemId: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("concreteira_esg").update({ status: "rascunho" }).eq("id", itemId);
  if (error) throw error;
  revalidatePath(`/esg/${itemId}`);
  revalidatePath("/esg");
}

export async function excluirRascunho(itemId: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("concreteira_esg").delete().eq("id", itemId);
  if (error) throw error;
  revalidatePath("/esg");
}

export interface UploadDocumentoState {
  error?: string;
}

export async function enviarDocumento(
  itemId: string,
  _prev: UploadDocumentoState,
  formData: FormData,
): Promise<UploadDocumentoState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConcreteira(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  const caminho = `${sessao.concreteiraId}/${itemId}/${Date.now()}-${arquivo.name}`;

  const { error: uploadErr } = await db.storage
    .from("concreteira-esg-docs")
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
  if (uploadErr) return { error: "Falha no envio do arquivo: " + uploadErr.message };

  const { error: dbErr } = await db.from("concreteira_esg_documentos").insert({
    item_id: itemId,
    nome_arquivo: arquivo.name,
    storage_path: caminho,
    tamanho_bytes: arquivo.size,
    content_type: arquivo.type || null,
    enviado_por: sessao.userId,
  });
  if (dbErr) {
    await db.storage.from("concreteira-esg-docs").remove([caminho]);
    return { error: "Falha ao registrar o documento: " + dbErr.message };
  }

  revalidatePath(`/esg/${itemId}`);
  return {};
}

export async function removerDocumento(documentoId: string, itemId: string, storagePath: string) {
  const db = await createServerSupabase();
  await db.storage.from("concreteira-esg-docs").remove([storagePath]);
  const { error } = await db.from("concreteira_esg_documentos").delete().eq("id", documentoId);
  if (error) throw error;
  revalidatePath(`/esg/${itemId}`);
}
