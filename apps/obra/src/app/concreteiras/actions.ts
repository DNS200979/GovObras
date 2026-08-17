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

export interface MaterializarResultado {
  ok: boolean;
  mensagem: string;
}

interface ComposicaoParaCalculo {
  insumo: string;
  quantidade: number;
  unidade: string;
  fator_id: string | null;
  fatores_emissao: { valor: number; unidade: string } | null;
}

/**
 * Converte a composição declarada pela concreteira em lançamentos de
 * carbono (módulo A1-A3, natureza passivo) no inventário em aberto da obra.
 *
 * Só o RT materializa — é quem assina o dossiê, mesma segregação de função
 * que o resto do schema já segue (seção 5.3). A escrita em `lancamentos`
 * passa pelo client admin de propósito: essa tabela não tem NENHUMA policy
 * de INSERT (só leitura) — hoje o único jeito confiável de gravar o ledger
 * é um processo de confiança, não a sessão do usuário. A checagem de posse
 * da obra e do papel acontece aqui, em código, antes de usar esse client.
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
      entrega_composicao: ComposicaoParaCalculo[];
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

  // Só entra no cálculo o insumo com fator vinculado E cuja unidade declarada
  // bate exatamente com a que o fator espera (ex.: fator em tCO2e/t exige
  // quantidade em "t") — sem isso o número sairia errado silenciosamente.
  const linhas: { insumo: string; quantidade: number; unidade: string; fator_id: string; tco2e: number }[] = [];
  const ignoradas: string[] = [];

  for (const c of entrega.entrega_composicao ?? []) {
    if (!c.fator_id || !c.fatores_emissao) {
      ignoradas.push(`${c.insumo} (sem fator vinculado)`);
      continue;
    }
    const partes = c.fatores_emissao.unidade.split("/");
    if (partes.length !== 2) {
      ignoradas.push(`${c.insumo} (fator com unidade não reconhecida: ${c.fatores_emissao.unidade})`);
      continue;
    }
    const [saida, entrada] = partes;
    if (c.unidade !== entrada) {
      ignoradas.push(`${c.insumo} (unidade "${c.unidade}" não bate com a esperada "${entrada}")`);
      continue;
    }
    const bruto = Number(c.quantidade) * Number(c.fatores_emissao.valor);
    const tco2e = saida.startsWith("kgCO2e") ? bruto / 1000 : bruto;
    linhas.push({ insumo: c.insumo, quantidade: Number(c.quantidade), unidade: c.unidade, fator_id: c.fator_id, tco2e });
  }

  if (linhas.length === 0) {
    return {
      ok: false,
      mensagem:
        "Nenhum insumo com fator de emissão compatível — nada a lançar." +
        (ignoradas.length ? " Ignorados: " + ignoradas.join("; ") + "." : ""),
    };
  }

  const admin = createAdminClient();
  const { error: lancErr } = await admin.from("lancamentos").insert(
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
