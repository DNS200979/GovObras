"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@carbonfree/database/admin";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";

export interface VincularConcreteiraState {
  error?: string;
}

export async function vincularConcreteira(
  _prev: VincularConcreteiraState,
  formData: FormData,
): Promise<VincularConcreteiraState> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { error: "Sessão expirada — faça login novamente." };

  const obraId = formData.get("obra_id")?.toString();
  const cnpj = formData.get("cnpj")?.toString().trim();
  const razaoSocial = formData.get("razao_social")?.toString().trim();

  if (!obraId || !cnpj) {
    return { error: "Preencha a obra e o CNPJ da concreteira." };
  }

  // RLS só deixa a construtora enxergar concreteiras que ela já vinculou —
  // então a busca por CNPJ de uma concreteira nova (cadastrada por outra
  // construtora) precisa do client admin. Só usado para achar o id; a
  // criação em si passa pelo client de sessão, sujeito à política normal.
  const admin = createAdminClient();
  const { data: existente } = await admin
    .from("concreteiras")
    .select("id")
    .eq("cnpj", cnpj)
    .maybeSingle();

  let concreteiraId: string | undefined = existente?.id;

  if (!concreteiraId) {
    if (!razaoSocial) {
      return { error: "Não encontramos essa concreteira — informe a razão social para cadastrá-la." };
    }
    const { data: nova, error: criarErr } = await db
      .from("concreteiras")
      .insert({ razao_social: razaoSocial, cnpj })
      .select("id")
      .single();
    if (criarErr) {
      return {
        error: criarErr.message.includes("duplicate")
          ? "Já existe uma concreteira com esse CNPJ."
          : "Não foi possível cadastrar a concreteira: " + criarErr.message,
      };
    }
    concreteiraId = nova.id;
  }

  const { error: vincErr } = await db.from("obra_concreteiras").insert({
    obra_id: obraId,
    concreteira_id: concreteiraId,
    convidado_por: sessao.userId,
  });

  if (vincErr) {
    return {
      error: vincErr.message.includes("duplicate")
        ? "Essa concreteira já está vinculada a essa obra."
        : "Não foi possível vincular: " + vincErr.message,
    };
  }

  revalidatePath("/concreteiras");
  redirect("/concreteiras");
}
