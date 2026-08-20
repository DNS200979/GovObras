"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import type { CamadaWms, CategoriaCamada } from "@/lib/geo-layers";
import type { LimiteMunicipio } from "@/lib/geo-municipio";
import type { ObraNoMapa } from "@/lib/queries";

// Ícone padrão do Leaflet quebra com bundler (webpack/Turbopack resolve os
// paths do PNG errado) — aponta pro CDN do próprio pacote como fallback.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const categoriaLabel: Record<CategoriaCamada, string> = {
  limite: "Limite",
  preservacao: "Preservação",
  hidrografia: "Hidrografia",
  cadastro: "Cadastro",
};

/** Enquadra o mapa no contorno do município assim que ele é desenhado. */
function AjustarAoLimite({ limite }: { limite: LimiteMunicipio | null }) {
  const map = useMap();
  useMemo(() => {
    if (!limite) return;
    try {
      const layer = L.geoJSON(limite as never);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] });
    } catch {
      // contorno inesperado — mantém o centro/zoom default em vez de quebrar o mapa
    }
  }, [limite, map]);
  return null;
}

export function MapaClient({
  municipioNome,
  limite,
  camadas,
  obras,
}: {
  municipioNome: string;
  limite: LimiteMunicipio | null;
  camadas: CamadaWms[];
  obras: ObraNoMapa[];
}) {
  const [ativas, setAtivas] = useState<Set<string>>(
    new Set(camadas.filter((c) => c.ativaPorPadrao).map((c) => c.id)),
  );

  function alternar(id: string) {
    setAtivas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const porCategoria = useMemo(() => {
    const grupos = new Map<CategoriaCamada, CamadaWms[]>();
    for (const c of camadas) {
      if (!grupos.has(c.categoria)) grupos.set(c.categoria, []);
      grupos.get(c.categoria)!.push(c);
    }
    return grupos;
  }, [camadas]);

  const obrasComCoordenada = obras.filter((o) => o.latitude !== null && o.longitude !== null);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Camadas
        </p>
        <div className="grid gap-4">
          {[...porCategoria.entries()].map(([categoria, itens]) => (
            <div key={categoria}>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                {categoriaLabel[categoria]}
              </p>
              <div className="grid gap-1.5">
                {itens.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ativas.has(c.id)}
                      onChange={() => alternar(c.id)}
                      className="mt-0.5"
                    />
                    <span>
                      {c.titulo}
                      <span className="block font-mono text-[10px] text-muted-foreground">
                        {c.atribuicao}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {camadas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma camada confirmada pra {municipioNome} ainda além do limite municipal.
            </p>
          )}
        </div>
      </aside>

      <div className="h-[70vh] overflow-hidden rounded-lg border border-border">
        <MapContainer center={[-27.5954, -48.548]} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {limite ? (
            <GeoJSON
              data={limite as never}
              style={{ color: "var(--color-primary, #2563eb)", weight: 2, fillOpacity: 0.03 }}
            />
          ) : null}
          <AjustarAoLimite limite={limite} />

          {camadas
            .filter((c) => ativas.has(c.id))
            .map((c) => (
              <WMSTileLayer
                key={c.id}
                url={`/api/geo/wms?camada=${c.id}`}
                layers={c.layerName}
                format="image/png"
                transparent
                version="1.3.0"
                attribution={c.atribuicao}
              />
            ))}

          {obrasComCoordenada.map((o) => (
            <Marker key={o.id} position={[o.latitude as number, o.longitude as number]}>
              <Popup>
                <strong>{o.nome}</strong>
                <br />
                Alvará {o.alvaraNumero}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
