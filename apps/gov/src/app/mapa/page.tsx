import { AppShell } from "@/components/app-shell";
import { camadasParaMunicipio } from "@/lib/geo-layers";
import { getLimiteMunicipio } from "@/lib/geo-municipio";
import { getMeuMunicipio, listObrasNoMapa } from "@/lib/queries";
import { MapaClient } from "./mapa-loader";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const [municipio, obras] = await Promise.all([getMeuMunicipio(), listObrasNoMapa()]);

  const limite = municipio?.codigoIbge ? await getLimiteMunicipio(municipio.codigoIbge) : null;
  const camadas = camadasParaMunicipio(municipio?.codigoIbge ?? null);

  return (
    <AppShell active="/mapa">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Território
      </p>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight">
        Mapa do município
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Limite municipal, imóveis rurais declarados no CAR e, onde disponível, camadas ambientais
        e de cadastro do próprio geoportal municipal — pra apoiar a demarcação de obras.
        {!municipio?.codigoIbge && (
          <span className="mt-1 block text-amber-600">
            Este município ainda não tem código IBGE cadastrado — o contorno não aparece até isso
            ser preenchido.
          </span>
        )}
      </p>

      <MapaClient
        municipioNome={municipio?.nome ?? "—"}
        limite={limite}
        camadas={camadas}
        obras={obras}
      />
    </AppShell>
  );
}
