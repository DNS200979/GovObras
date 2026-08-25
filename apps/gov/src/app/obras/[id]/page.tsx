import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import { camadasParaMunicipio } from "@/lib/geo-layers";
import { consultarPontoEmCamadas } from "@/lib/geo-consulta";
import { getMeuMunicipio, getObraDetalhe } from "@/lib/queries";

export const dynamic = "force-dynamic";

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

function formatarAtributos(attrs: Record<string, unknown>) {
  return Object.entries(attrs)
    .filter(([, v]) => v !== null && typeof v !== "object")
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export default async function ObraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [obra, municipio] = await Promise.all([getObraDetalhe(id), getMeuMunicipio()]);
  if (!obra) notFound();

  const temPonto = obra.latitude !== null && obra.longitude !== null;
  const camadas = camadasParaMunicipio(municipio?.codigoIbge ?? null);
  const camadasProtecao = camadas.filter((c) => c.categoria === "preservacao");
  const camadasCadastro = camadas.filter((c) => c.categoria === "cadastro");

  const [resultadosProtecao, resultadosCadastro] = temPonto
    ? await Promise.all([
        consultarPontoEmCamadas(camadasProtecao, obra.latitude as number, obra.longitude as number),
        consultarPontoEmCamadas(camadasCadastro, obra.latitude as number, obra.longitude as number),
      ])
    : [[], []];

  const dentroDeAreaProtegida = resultadosProtecao.some((r) => r.encontrado);

  return (
    <AppShell active="/obras">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {obra.alvara} · {obra.construtora}
      </p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight">{obra.nome}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados da obra</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tipologia:</span> {obra.tipologia}
            </p>
            <p>
              <span className="text-muted-foreground">Área:</span> {obra.areaM2.toLocaleString("pt-BR")} m²
            </p>
            <p>
              <span className="text-muted-foreground">Fase:</span> {faseLabel[obra.fase] ?? obra.fase}
            </p>
            <p>
              <span className="text-muted-foreground">Inscrição imobiliária declarada:</span>{" "}
              {obra.inscricaoImobiliaria ?? "não informada"}
            </p>
            <p>
              <span className="text-muted-foreground">Coordenada:</span>{" "}
              {temPonto ? `${obra.latitude}, ${obra.longitude}` : "não cadastrada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verificação territorial</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {!temPonto ? (
              <p className="text-muted-foreground">
                Essa obra não tem coordenada cadastrada — não dá pra verificar contra as camadas do
                mapa territorial sem um ponto.
              </p>
            ) : (
              <>
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="font-semibold">Área protegida</span>
                    <Badge variant={dentroDeAreaProtegida ? "destructive" : "success"}>
                      {dentroDeAreaProtegida ? "possível conflito" : "nenhuma encontrada"}
                    </Badge>
                  </div>
                  {camadasProtecao.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhuma camada de preservação confirmada pra esse município ainda.
                    </p>
                  ) : (
                    <ul className="grid gap-1">
                      {resultadosProtecao.map((r) => (
                        <li key={r.camadaId} className="text-muted-foreground">
                          {r.encontrado ? "⚠️" : "—"} <span className="text-foreground">{r.titulo}</span>
                          {r.erro ? ` (erro: ${r.erro})` : ""}
                          {r.encontrado && r.atributos ? (
                            <span className="block pl-5 font-mono text-[11px]">
                              {formatarAtributos(r.atributos)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 font-semibold">Cadastro/regularização no ponto</p>
                  {camadasCadastro.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhuma camada de cadastro confirmada pra esse município ainda.
                    </p>
                  ) : (
                    <ul className="grid gap-1">
                      {resultadosCadastro.map((r) => (
                        <li key={r.camadaId} className="text-muted-foreground">
                          {r.encontrado ? "✅" : "—"} <span className="text-foreground">{r.titulo}</span>
                          {r.erro ? ` (erro: ${r.erro})` : ""}
                          {r.encontrado && r.atributos ? (
                            <span className="block pl-5 font-mono text-[11px]">
                              {formatarAtributos(r.atributos)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">
                    Compare o que apareceu acima com a inscrição declarada
                    {obra.inscricaoImobiliaria ? ` ("${obra.inscricaoImobiliaria}")` : ""} — a
                    verificação automática mostra o que existe no ponto, não confirma sozinha se bate
                    com o que foi declarado.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
