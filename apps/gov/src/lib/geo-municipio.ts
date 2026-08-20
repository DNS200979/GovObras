/** Limite territorial do município via API de Malhas do IBGE — fronteira não muda, cache de 1 dia. */

export interface LimiteMunicipio {
  type: "FeatureCollection";
  features: unknown[];
}

export async function getLimiteMunicipio(codigoIbge: string): Promise<LimiteMunicipio | null> {
  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigoIbge}?formato=application/vnd.geo+json&qualidade=intermediaria`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return null;
  return res.json();
}
