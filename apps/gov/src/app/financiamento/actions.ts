"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";
import { sugestoesDoDiagnostico } from "@/lib/prefill-diagnostico";
import type { Resposta, SituacaoDoc } from "@/lib/financiamento";

export interface ProjetoState {
  error?: string;
  ok?: boolean;
}

export async function criarProjetoCaptacao(
  _prev: ProjetoState,
  formData: FormData,
): Promise<ProjetoState> {
  const nome = formData.get("nome")?.toString().trim();
  const descricao = formData.get("descricao")?.toString().trim();
  const tema = formData.get("tema")?.toString();
  const valorRaw = formData.get("valorEstimado")?.toString().trim();

  if (!nome || !descricao || !tema) {
    return { error: "Preencha nome, descrição e tema." };
  }

  let valor: number | null = null;
  if (valorRaw) {
    valor = Number(valorRaw.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(valor) || valor < 0) return { error: "Valor estimado inválido." };
  }

  const db = await createServerSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data: municipio } = await db.from("municipios").select("id").single();
  if (!municipio || !user) return { error: "Sessão ou município não encontrados." };

  const { data: projeto, error } = await db
    .from("projetos_captacao")
    .insert({
      municipio_id: municipio.id,
      nome,
      descricao,
      tema,
      valor_estimado_brl: valor,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível criar o projeto: " + error.message };

  // Já entra com o que a plataforma consegue responder sozinha.
  const sugestoes = await sugestoesDoDiagnostico();
  if (sugestoes.length > 0) {
    await db.from("diagnostico_respostas").insert(
      sugestoes.map((s) => ({
        projeto_id: projeto.id,
        questao_id: s.questaoId,
        resposta: s.resposta,
        evidencia: s.evidencia,
        origem: "automatico",
        respondido_por: user.id,
      })),
    );
  }

  redirect(`/financiamento/${projeto.id}`);
}

export async function responderQuestao(
  projetoId: string,
  questaoId: number,
  resposta: Resposta,
) {
  const db = await createServerSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();

  // Resposta da prefeitura sobrescreve a sugestão automática, e a evidência
  // deduzida some junto — ela justificava a sugestão, não a nova resposta.
  const { error } = await db.from("diagnostico_respostas").upsert(
    {
      projeto_id: projetoId,
      questao_id: questaoId,
      resposta,
      origem: "manual",
      evidencia: null,
      respondido_por: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "projeto_id,questao_id" },
  );
  if (error) throw error;

  revalidatePath(`/financiamento/${projetoId}`);
  revalidatePath("/financiamento");
}

export async function definirSituacaoDocumento(
  projetoId: string,
  documentoId: number,
  situacao: SituacaoDoc,
) {
  const db = await createServerSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();

  const { error } = await db.from("projeto_documentos").upsert(
    {
      projeto_id: projetoId,
      documento_id: documentoId,
      situacao,
      atualizado_por: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "projeto_id,documento_id" },
  );
  if (error) throw error;

  revalidatePath(`/financiamento/${projetoId}/documentos`);
}

export interface AnexoState {
  error?: string;
  ok?: boolean;
}

const TAMANHO_MAX = 20 * 1024 * 1024;

export async function anexarDocumento(
  _prev: AnexoState,
  formData: FormData,
): Promise<AnexoState> {
  const projetoId = formData.get("projetoId")?.toString();
  const documentoId = Number(formData.get("documentoId"));
  const arquivo = formData.get("arquivo");

  if (!projetoId || !documentoId || !(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (arquivo.size > TAMANHO_MAX) {
    return { error: "Arquivo acima de 20 MB." };
  }

  const db = await createServerSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data: projeto } = await db
    .from("projetos_captacao")
    .select("municipio_id")
    .eq("id", projetoId)
    .single();
  if (!projeto || !user) return { error: "Projeto não encontrado." };

  // Nome saneado: o original vira metadado, o caminho não depende dele.
  const extensao = arquivo.name.includes(".") ? arquivo.name.split(".").pop() : "bin";
  const caminho = `${projeto.municipio_id}/${projetoId}/doc-${documentoId}.${extensao}`;

  const { error: erroUpload } = await db.storage
    .from("captacao-docs")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type || undefined });
  if (erroUpload) return { error: "Falha ao enviar: " + erroUpload.message };

  // Anexar um documento é dizer que ele existe — a situação acompanha, a menos
  // que já estivesse marcada como pronto ou não aplicável.
  const { data: atual } = await db
    .from("projeto_documentos")
    .select("situacao")
    .eq("projeto_id", projetoId)
    .eq("documento_id", documentoId)
    .maybeSingle();

  const situacao =
    atual?.situacao === "pronto" || atual?.situacao === "nao_aplicavel"
      ? atual.situacao
      : "em_elaboracao";

  const { error } = await db.from("projeto_documentos").upsert(
    {
      projeto_id: projetoId,
      documento_id: documentoId,
      situacao,
      nome_arquivo: arquivo.name,
      storage_path: caminho,
      tamanho_bytes: arquivo.size,
      content_type: arquivo.type || null,
      atualizado_por: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "projeto_id,documento_id" },
  );
  if (error) return { error: "Falha ao registrar: " + error.message };

  revalidatePath(`/financiamento/${projetoId}/documentos`);
  return { ok: true };
}

export async function removerAnexo(projetoId: string, documentoId: number) {
  const db = await createServerSupabase();
  const { data: registro } = await db
    .from("projeto_documentos")
    .select("storage_path")
    .eq("projeto_id", projetoId)
    .eq("documento_id", documentoId)
    .maybeSingle();

  if (registro?.storage_path) {
    await db.storage.from("captacao-docs").remove([registro.storage_path]);
  }

  const { error } = await db
    .from("projeto_documentos")
    .update({ nome_arquivo: null, storage_path: null, tamanho_bytes: null, content_type: null })
    .eq("projeto_id", projetoId)
    .eq("documento_id", documentoId);
  if (error) throw error;

  revalidatePath(`/financiamento/${projetoId}/documentos`);
}

export async function baixarAnexo(storagePath: string) {
  const db = await createServerSupabase();
  const { data } = await db.storage.from("captacao-docs").createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}
