import { NextResponse } from "next/server";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";

export async function POST(request: Request) {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada — faça login novamente." }, { status: 401 });
  }

  const formData = await request.formData();
  const obraId = formData.get("obra_id")?.toString();
  const titulo = formData.get("titulo")?.toString().trim();
  const descricao = formData.get("descricao")?.toString().trim();
  const categoria = formData.get("categoria")?.toString();

  if (!obraId || !titulo || !descricao || !categoria) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
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

  if (error) {
    return NextResponse.json({ error: "Não foi possível criar o projeto: " + error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
