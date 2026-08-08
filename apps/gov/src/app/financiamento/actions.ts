"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";
import { sugestoesDoDiagnostico } from "@/lib/prefill-diagnostico";
import type { Resposta } from "@/lib/financiamento";

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
