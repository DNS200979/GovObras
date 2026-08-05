import { NextResponse } from "next/server";
import { createServerSupabase } from "@carbonfree/database/server";
import { getSessaoConstrutora } from "@/lib/sessao";

const TIPOLOGIAS = [
  "Residencial vertical",
  "Residencial horizontal",
  "Comercial",
  "Industrial",
  "Institucional",
  "Misto",
];

export async function POST(request: Request) {
  const db = await createServerSupabase();
  const sessao = await getSessaoConstrutora(db);
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada — faça login novamente." }, { status: 401 });
  }

  const form = await request.formData();
  const nome = form.get("nome")?.toString().trim();
  const municipioId = form.get("municipio_id")?.toString();
  const alvara = form.get("alvara_numero")?.toString().trim();
  const tipologia = form.get("tipologia")?.toString();
  const areaRaw = form.get("area_construida_m2")?.toString().trim();
  const inscricao = form.get("inscricao_imobiliaria")?.toString().trim() || null;
  const cno = form.get("cno")?.toString().trim() || null;
  const fase = form.get("fase")?.toString() || "fundacao";
  const latRaw = form.get("latitude")?.toString().trim();
  const lngRaw = form.get("longitude")?.toString().trim();

  if (!nome || !municipioId || !alvara || !tipologia || !areaRaw) {
    return NextResponse.json(
      { error: "Preencha nome, município, alvará, tipologia e área construída." },
      { status: 400 },
    );
  }

  if (!TIPOLOGIAS.includes(tipologia)) {
    return NextResponse.json({ error: "Tipologia inválida." }, { status: 400 });
  }

  const area = Number(areaRaw.replace(",", "."));
  if (Number.isNaN(area) || area <= 0) {
    return NextResponse.json({ error: "Área construída deve ser um número maior que zero." }, { status: 400 });
  }

  // Coordenadas são opcionais, mas ou vêm as duas ou nenhuma.
  let coordenadas: string | null = null;
  if (latRaw || lngRaw) {
    const lat = Number(latRaw?.replace(",", "."));
    const lng = Number(lngRaw?.replace(",", "."));
    if (
      !latRaw ||
      !lngRaw ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: "Latitude/longitude inválidas — preencha as duas ou deixe as duas em branco." },
        { status: 400 },
      );
    }
    coordenadas = `SRID=4326;POINT(${lng} ${lat})`;
  }

  const { data, error } = await db
    .from("obras")
    .insert({
      municipio_id: municipioId,
      construtora_id: sessao.construtoraId,
      nome,
      alvara_numero: alvara,
      tipologia,
      area_construida_m2: area,
      inscricao_imobiliaria: inscricao,
      cno,
      fase,
      coordenadas,
    })
    .select("id")
    .single();

  if (error) {
    // unique (municipio_id, alvara_numero) — alvará já cadastrado naquele município
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Já existe uma obra com esse número de alvará neste município." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Não foi possível cadastrar a obra: " + error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
