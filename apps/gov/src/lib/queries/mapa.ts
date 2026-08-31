import { createServerSupabase } from "@carbonfree/database/server";

// ============================================================
// Mapa territorial
// ============================================================

export interface MeuMunicipio {
  id: string;
  nome: string;
  codigoIbge: string | null;
}

/** RLS já escopa `municipios` pro município do usuário logado — pega a linha única. */
export async function getMeuMunicipio(): Promise<MeuMunicipio | null> {
  const db = await createServerSupabase();
  const { data, error } = await db.from("municipios").select("id, nome, codigo_ibge").single();
  if (error || !data) return null;
  return { id: data.id, nome: data.nome, codigoIbge: data.codigo_ibge };
}

export interface ObraNoMapa {
  id: string;
  nome: string;
  alvaraNumero: string;
  latitude: number | null;
  longitude: number | null;
}

export async function listObrasNoMapa(): Promise<ObraNoMapa[]> {
  const db = await createServerSupabase();
  const { data, error } = await db.from("obras").select("id, nome, alvara_numero, latitude, longitude");
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    nome: o.nome,
    alvaraNumero: o.alvara_numero,
    latitude: o.latitude,
    longitude: o.longitude,
  }));
}
