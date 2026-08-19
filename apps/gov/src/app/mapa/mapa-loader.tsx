"use client";

import dynamic from "next/dynamic";

// `ssr: false` só é permitido dentro de um Client Component — Leaflet mexe
// direto no DOM/window e quebra em SSR, então isola esse detalhe aqui em
// vez de importar next/dynamic direto na page.tsx (Server Component).
export const MapaClient = dynamic(() => import("./mapa-client").then((m) => m.MapaClient), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
      Carregando mapa…
    </div>
  ),
});
