"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";
import { converterComposicao, type ComposicaoDeclarada } from "@/lib/materializacao";

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
  // então achar por CNPJ uma concreteira cadastrada por outra construtora
  // precisa de um caminho próprio. `buscar_concreteira_por_cnpj` (migration 31)
  // é security definer, devolve só o id e só responde a papéis de construtora.
  const { data: existenteId } = await db.rpc("buscar_concreteira_por_cnpj", {
    p_cnpj: cnpj,
  });

  let concreteiraId: string | undefined = existenteId ?? undefined;

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

export interface MaterializarResultado {
  ok: boolean;
  mensagem: string;
}

/**
 * Converte a composição declarada pela concreteira em lançamentos de
 * carbono (módulo A1-A3, natureza passivo) no inventário em aberto da obra.
 *
 * Só o RT materializa — é quem assina o dossiê, mesma segregação de função
 * que o resto do schema já segue (seção 5.3). Desde a migration 31 isso é
 * garantido pelo banco: a policy de INSERT em `lancamentos` exige ser RT, o
 * inventário ser de obra da própria construtora e estar aberto. As checagens
 * abaixo continuam para dar mensagem de erro decente, não como controle.
 */
export async function materializarEntrega(entregaId: string): Promise<MaterializarResultado> {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) return { ok: false, mensagem: "Sessão expirada — faça login novamente." };
  if (sessao.papel !== "construtora_rt") {
    return { ok: false, mensagem: "Só o responsável técnico (RT) pode materializar entregas no inventário." };
  }

  const { data: entrega, error: entErr } = await db
    .from("entregas_concreto")
    .select(
      "id, obra_id, status, evidencia_id, materializado_em, entrega_composicao(insumo, quantidade, unidade, fator_id, fatores_emissao(valor, unidade))",
    )
    .eq("id", entregaId)
    .single<{
      id: string;
      obra_id: string;
      status: string;
      evidencia_id: string | null;
      materializado_em: string | null;
      entrega_composicao: ComposicaoDeclarada[];
    }>();
  if (entErr || !entrega) return { ok: false, mensagem: "Entrega não encontrada." };

  if (entrega.materializado_em) {
    return { ok: false, mensagem: "Essa entrega já foi materializada." };
  }
  if (entrega.status !== "validada") {
    return { ok: false, mensagem: "Só é possível materializar entregas já validadas pela construtora." };
  }
  if (!entrega.evidencia_id) {
    return {
      ok: false,
      mensagem: "Essa entrega não tem evidência (NF-e/CT-e) anexada — peça pra concreteira anexar antes.",
    };
  }

  const { data: inventario, error: invErr } = await db
    .from("inventarios")
    .select("id, versao")
    .eq("obra_id", entrega.obra_id)
    .in("status", ["rascunho", "em_analise"])
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (invErr) return { ok: false, mensagem: "Erro ao buscar o inventário da obra: " + invErr.message };
  if (!inventario) {
    return {
      ok: false,
      mensagem:
        "Essa obra não tem inventário em rascunho ou em análise pra receber o lançamento — abra um inventário antes de materializar.",
    };
  }

  const { linhas, ignoradas } = converterComposicao(entrega.entrega_composicao ?? []);

  if (linhas.length === 0) {
    return {
      ok: false,
      mensagem:
        "Nenhum insumo com fator de emissão compatível — nada a lançar." +
        (ignoradas.length ? " Ignorados: " + ignoradas.join("; ") + "." : ""),
    };
  }

  const { error: lancErr } = await db.from("lancamentos").insert(
    linhas.map((l) => ({
      inventario_id: inventario.id,
      modulo_en15978: "A1-A3",
      natureza: "passivo",
      item: l.insumo,
      quantidade: l.quantidade,
      unidade: l.unidade,
      fator_id: l.fator_id,
      tco2e: l.tco2e,
      evidencia_id: entrega.evidencia_id,
    })),
  );
  if (lancErr) return { ok: false, mensagem: "Falha ao gravar os lançamentos: " + lancErr.message };

  const { error: updErr } = await db
    .from("entregas_concreto")
    .update({ materializado_em: new Date().toISOString(), materializado_por: sessao.userId })
    .eq("id", entregaId);
  if (updErr) {
    return {
      ok: false,
      mensagem:
        "Os lançamentos foram gravados, mas não consegui marcar a entrega como materializada — avise o suporte antes de tentar de novo: " +
        updErr.message,
    };
  }

  revalidatePath("/concreteiras");
  const total = linhas.reduce((s, l) => s + l.tco2e, 0);
  return {
    ok: true,
    mensagem:
      `Lançado no inventário v${inventario.versao}: ${linhas.length} insumo(s), ${total.toFixed(3)} tCO2e.` +
      (ignoradas.length ? " Ignorados (sem fator compatível): " + ignoradas.join("; ") + "." : ""),
  };
}
