import { createServerSupabase } from "@carbonfree/database/server";
import { DOCUMENTOS_ESPERADOS } from "../documentos";

// ============================================================
// Obras — cadastro pela própria construtora
// ============================================================

export interface ObraListItem {
  id: string;
  nome: string;
  alvaraNumero: string;
  tipologia: string;
  areaM2: number;
  fase: string;
  municipio: string;
  totalDocumentos: number;
  documentosFaltando: string[];
}

interface ObraListRow {
  id: string;
  nome: string;
  alvara_numero: string;
  tipologia: string;
  area_construida_m2: number;
  fase: string;
  municipios: { nome: string; uf: string } | null;
  obra_documentos: { tipo: string }[];
}

export async function listObras(): Promise<ObraListItem[]> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, tipologia, area_construida_m2, fase, municipios(nome, uf), obra_documentos(tipo)",
    )
    .order("created_at", { ascending: true })
    .returns<ObraListRow[]>();
  if (error) throw error;

  return (data ?? []).map((o) => {
    const tipos = new Set((o.obra_documentos ?? []).map((d) => d.tipo));
    return {
      id: o.id,
      nome: o.nome,
      alvaraNumero: o.alvara_numero,
      tipologia: o.tipologia,
      areaM2: o.area_construida_m2,
      fase: o.fase,
      municipio: o.municipios ? `${o.municipios.nome}/${o.municipios.uf}` : "—",
      totalDocumentos: (o.obra_documentos ?? []).length,
      documentosFaltando: DOCUMENTOS_ESPERADOS.filter((t) => !tipos.has(t)),
    };
  });
}

export interface ObraDocumento {
  id: string;
  tipo: string;
  descricao: string | null;
  nomeArquivo: string;
  storagePath: string;
  tamanhoBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ObraDetalhe {
  id: string;
  nome: string;
  alvaraNumero: string;
  tipologia: string;
  areaM2: number;
  fase: string;
  inscricaoImobiliaria: string | null;
  cno: string | null;
  latitude: number | null;
  longitude: number | null;
  municipio: string;
  documentos: ObraDocumento[];
  documentosFaltando: string[];
}

interface ObraDetalheRow {
  id: string;
  nome: string;
  alvara_numero: string;
  tipologia: string;
  area_construida_m2: number;
  fase: string;
  inscricao_imobiliaria: string | null;
  cno: string | null;
  latitude: number | null;
  longitude: number | null;
  municipios: { nome: string; uf: string } | null;
  obra_documentos: {
    id: string;
    tipo: string;
    descricao: string | null;
    nome_arquivo: string;
    storage_path: string;
    tamanho_bytes: number | null;
    created_at: string;
  }[];
}

export async function getObra(id: string): Promise<ObraDetalhe | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("obras")
    .select(
      "id, nome, alvara_numero, tipologia, area_construida_m2, fase, inscricao_imobiliaria, cno, latitude, longitude, municipios(nome, uf), obra_documentos(id, tipo, descricao, nome_arquivo, storage_path, tamanho_bytes, created_at)",
    )
    .eq("id", id)
    .single<ObraDetalheRow>();
  if (error) return null;

  const documentos = await Promise.all(
    (data.obra_documentos ?? []).map(async (doc) => {
      const { data: signed } = await db.storage
        .from("obra-docs")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return {
        id: doc.id,
        tipo: doc.tipo,
        descricao: doc.descricao,
        nomeArquivo: doc.nome_arquivo,
        storagePath: doc.storage_path,
        tamanhoBytes: doc.tamanho_bytes,
        createdAt: doc.created_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  const tipos = new Set(documentos.map((d) => d.tipo));

  return {
    id: data.id,
    nome: data.nome,
    alvaraNumero: data.alvara_numero,
    tipologia: data.tipologia,
    areaM2: data.area_construida_m2,
    fase: data.fase,
    inscricaoImobiliaria: data.inscricao_imobiliaria,
    cno: data.cno,
    latitude: data.latitude,
    longitude: data.longitude,
    municipio: data.municipios ? `${data.municipios.nome}/${data.municipios.uf}` : "—",
    documentos,
    documentosFaltando: DOCUMENTOS_ESPERADOS.filter((t) => !tipos.has(t)),
  };
}

export async function listMunicipios() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("municipios").select("id, nome, uf").order("nome");
  if (error) throw error;
  return data ?? [];
}
