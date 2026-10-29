"use server";
import { storage } from "@carbonfree/database/storage";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";

export interface CriarProjetoState {
  error?: string;
}

export async function criarProjetoEsg(
  _prev: CriarProjetoState,
  formData: FormData,
): Promise<CriarProjetoState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const obraId = formData.get("obra_id")?.toString();
  const titulo = formData.get("titulo")?.toString().trim();
  const descricao = formData.get("descricao")?.toString().trim();
  const categoria = formData.get("categoria")?.toString();

  if (!obraId || !titulo || !descricao || !categoria) {
    return { error: "Preencha todos os campos." };
  }

  const { data, error } = await db
    .from("projetos_esg")
    .insert({
      obra_id: obraId,
      construtora_id: sessao.construtoraId,
      titulo,
      descricao,
      categoria,
      criado_por: sessao.userId,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível criar o projeto: " + error.message };

  redirect(`/esg/${data.id}`);
}

export async function enviarParaAnalise(projetoId: string) {
  const db = await createServerSupabase();
  const { error } = await db
    .from("projetos_esg")
    .update({ status: "enviado", enviado_em: new Date().toISOString() })
    .eq("id", projetoId);
  if (error) throw error;
  revalidatePath(`/esg/${projetoId}`);
  revalidatePath("/esg");
}

export async function excluirRascunho(projetoId: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("projetos_esg").delete().eq("id", projetoId);
  if (error) throw error;
  revalidatePath("/esg");
}

export interface UploadDocumentoState {
  error?: string;
}

export async function enviarDocumento(
  projetoId: string,
  _prev: UploadDocumentoState,
  formData: FormData,
): Promise<UploadDocumentoState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  const caminho = `${sessao.construtoraId}/${projetoId}/${Date.now()}-${arquivo.name}`;

  const { error: uploadErr } = await storage
    .from("projetos-esg-docs")
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
  if (uploadErr) return { error: "Falha no envio do arquivo: " + uploadErr.message };

  const { error: dbErr } = await db.from("projeto_esg_documentos").insert({
    projeto_id: projetoId,
    nome_arquivo: arquivo.name,
    storage_path: caminho,
    tamanho_bytes: arquivo.size,
    content_type: arquivo.type || null,
    enviado_por: sessao.userId,
  });
  if (dbErr) {
    await storage.from("projetos-esg-docs").remove([caminho]);
    return { error: "Falha ao registrar o documento: " + dbErr.message };
  }

  revalidatePath(`/esg/${projetoId}`);
  return {};
}

export async function removerDocumento(documentoId: string, projetoId: string, _storagePath?: string) {
  const db = await createServerSupabase();
  // apaga o registro primeiro (RLS decide se pode) e remove o arquivo registrado, não o caminho recebido
  const { data: removidos, error } = await db
    .from("projeto_esg_documentos")
    .delete()
    .eq("id", documentoId)
    .select("storage_path");
  if (error) throw error;
  const caminhos = (removidos ?? []).map((d) => d.storage_path).filter(Boolean) as string[];
  if (caminhos.length > 0) await storage.from("projetos-esg-docs").remove(caminhos);
  revalidatePath(`/esg/${projetoId}`);
}
