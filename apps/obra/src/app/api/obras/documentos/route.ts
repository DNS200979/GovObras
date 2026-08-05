import { NextResponse } from "next/server";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";
import { tipoDocumentoLabel } from "@/lib/documentos";

export async function POST(request: Request) {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada — faça login novamente." }, { status: 401 });
  }

  const form = await request.formData();
  const obraId = form.get("obra_id")?.toString();
  const tipo = form.get("tipo")?.toString();
  const descricao = form.get("descricao")?.toString().trim() || null;
  const arquivo = form.get("arquivo");

  if (!obraId || !tipo || !(tipo in tipoDocumentoLabel)) {
    return NextResponse.json({ error: "Informe a obra e o tipo do documento." }, { status: 400 });
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
  }

  const caminho = `${sessao.construtoraId}/${obraId}/${Date.now()}-${arquivo.name}`;

  const { error: uploadErr } = await db.storage
    .from("obra-docs")
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
  if (uploadErr) {
    return NextResponse.json({ error: "Falha no envio do arquivo: " + uploadErr.message }, { status: 400 });
  }

  const { error: dbErr } = await db.from("obra_documentos").insert({
    obra_id: obraId,
    tipo,
    descricao,
    nome_arquivo: arquivo.name,
    storage_path: caminho,
    tamanho_bytes: arquivo.size,
    content_type: arquivo.type || null,
    enviado_por: sessao.userId,
  });

  if (dbErr) {
    // não deixa arquivo órfão no bucket se o registro falhar
    await db.storage.from("obra-docs").remove([caminho]);
    return NextResponse.json({ error: "Falha ao registrar o documento: " + dbErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { id, storagePath } = await request.json();
  if (!id || !storagePath) {
    return NextResponse.json({ error: "Documento não informado." }, { status: 400 });
  }

  await db.storage.from("obra-docs").remove([storagePath]);
  const { error } = await db.from("obra_documentos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
