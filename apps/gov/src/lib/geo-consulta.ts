import type { CamadaWms } from "./geo-layers";

export interface ResultadoConsultaCamada {
  camadaId: string;
  titulo: string;
  categoria: CamadaWms["categoria"];
  atribuicao: string;
  encontrado: boolean;
  /** Atributos crus devolvidos pelo GetFeatureInfo — schema varia por fonte, mostrado como veio. */
  atributos: Record<string, unknown> | null;
  erro?: string;
}

/**
 * Consulta uma camada WMS num ponto exato via GetFeatureInfo — é como se
 * clicasse naquele pixel no mapa. Usa uma caixa minúscula (~11m) em volta
 * do ponto, com o próprio ponto no pixel central, e pede a primeira
 * feature encontrada ali.
 *
 * Chamado direto do servidor (Server Component/Action) contra a fonte de
 * origem — sem passar pelo /api/geo/wms, que existe pra resolver
 * mixed-content/CORS do navegador; server-to-server não tem esse problema.
 */
export async function consultarPonto(
  camada: CamadaWms,
  lat: number,
  lon: number,
): Promise<ResultadoConsultaCamada> {
  const delta = 0.0001; // ~11m
  const bbox = [lat - delta, lon - delta, lat + delta, lon + delta].join(",");

  const url = new URL(camada.baseUrl);
  url.searchParams.set("service", "WMS");
  url.searchParams.set("version", "1.3.0");
  url.searchParams.set("request", "GetFeatureInfo");
  url.searchParams.set("layers", camada.layerName);
  url.searchParams.set("query_layers", camada.layerName);
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("width", "101");
  url.searchParams.set("height", "101");
  url.searchParams.set("i", "50");
  url.searchParams.set("j", "50");
  url.searchParams.set("crs", "EPSG:4326");
  url.searchParams.set("info_format", "application/json");
  url.searchParams.set("feature_count", "1");

  const base: Omit<ResultadoConsultaCamada, "encontrado" | "atributos" | "erro"> = {
    camadaId: camada.id,
    titulo: camada.titulo,
    categoria: camada.categoria,
    atribuicao: camada.atribuicao,
  };

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!res.ok) {
      return { ...base, encontrado: false, atributos: null, erro: `fonte respondeu ${res.status}` };
    }
    const dados = await res.json();
    const feature = dados?.features?.[0];
    if (!feature) return { ...base, encontrado: false, atributos: null };
    return { ...base, encontrado: true, atributos: feature.properties ?? null };
  } catch (err) {
    return {
      ...base,
      encontrado: false,
      atributos: null,
      erro: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function consultarPontoEmCamadas(
  camadas: CamadaWms[],
  lat: number,
  lon: number,
): Promise<ResultadoConsultaCamada[]> {
  return Promise.all(camadas.map((c) => consultarPonto(c, lat, lon)));
}
