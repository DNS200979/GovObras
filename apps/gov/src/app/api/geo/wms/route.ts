import { NextResponse, type NextRequest } from "next/server";
import { getCamada } from "@/lib/geo-layers";

/**
 * Proxy pras camadas WMS do mapa territorial. O Leaflet aponta
 * `L.tileLayer.wms`/GetFeatureInfo pra cá em vez de direto pro GeoServer de
 * origem — resolve três problemas de uma vez:
 *
 * 1. mixed content: o SIGSC só serve HTTP, e a página é HTTPS;
 * 2. CORS: GetFeatureInfo é fetch/XHR (GetMap de tile não precisaria, é
 *    <img src>, mas manter os dois no mesmo caminho simplifica);
 * 3. a URL de origem de cada fonte pública fica num lugar só
 *    (`@/lib/geo-layers`), não espalhada pelo código do cliente.
 *
 * `camada` identifica a entrada no registro; todo o resto da query string
 * (bbox, width, height, srs/crs, request, i, j etc.) é repassado como veio
 * — quem monta a query certa é o Leaflet no cliente, aqui só se resolve
 * `layers`/`query_layers` pro nome real da camada de origem.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const camadaId = params.get("camada");
  if (!camadaId) {
    return NextResponse.json({ error: "Parâmetro 'camada' é obrigatório." }, { status: 400 });
  }

  const camada = getCamada(camadaId);
  if (!camada) {
    return NextResponse.json({ error: `Camada desconhecida: ${camadaId}` }, { status: 400 });
  }

  const upstream = new URL(camada.baseUrl);
  for (const [key, value] of params.entries()) {
    if (key === "camada") continue;
    upstream.searchParams.set(key, value);
  }
  upstream.searchParams.set("service", "WMS");
  upstream.searchParams.set("layers", camada.layerName);
  if (params.has("query_layers")) {
    upstream.searchParams.set("query_layers", camada.layerName);
  }

  const isGetMap = (params.get("request") ?? "GetMap").toLowerCase() === "getmap";

  let resposta: Response;
  try {
    resposta = await fetch(upstream, { signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao consultar a fonte de origem: " + (err instanceof Error ? err.message : String(err)) },
      { status: 502 },
    );
  }

  if (!resposta.ok) {
    return NextResponse.json({ error: `Fonte de origem respondeu ${resposta.status}` }, { status: 502 });
  }

  const contentType = resposta.headers.get("content-type") ?? "application/octet-stream";
  const corpo = await resposta.arrayBuffer();

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": contentType,
      // Tile de mapa de fonte pública governamental muda raríssimo — cache
      // agressivo evita martelar o servidor de origem a cada pan/zoom.
      // GetFeatureInfo (clique) não é tile, não faz sentido cachear.
      "Cache-Control": isGetMap ? "public, max-age=3600, stale-while-revalidate=86400" : "no-store",
    },
  });
}
