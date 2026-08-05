import Link from "next/link";
import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { HeaderActions } from "@/components/header-actions";
import { obraNav } from "@/lib/nav";
import { listObras } from "@/lib/queries";
import { tipoDocumentoLabel } from "@/lib/documentos";

export const dynamic = "force-dynamic";

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

export default async function ObrasPage() {
  const obras = await listObras();

  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/obras")}
      headerRight={<HeaderActions />}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <CardEyebrow>Cadastro · alvará e documentação</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Obras
          </h1>
        </div>
        <Link
          href="/obras/nova"
          className="shrink-0 rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Cadastrar obra
        </Link>
      </div>

      {obras.length === 0 ? (
        <Card>
          <p className="py-12 text-center text-[13.5px] text-texto-fraco">
            Nenhuma obra cadastrada ainda. Cadastre a obra com o número do alvará e anexe a
            documentação exigida pela prefeitura.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {obras.map((o) => (
            <Link key={o.id} href={`/obras/${o.id}`}>
              <Card className="transition-colors hover:border-verde">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[14px] font-bold text-texto">{o.nome}</span>
                      <Badge>{faseLabel[o.fase] ?? o.fase}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                      {o.alvaraNumero} · {o.municipio} · {o.tipologia} ·{" "}
                      {o.areaM2.toLocaleString("pt-BR")} m²
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-[11px] text-texto-fraco">
                      {o.totalDocumentos} documento{o.totalDocumentos === 1 ? "" : "s"}
                    </p>
                    {o.documentosFaltando.length > 0 ? (
                      <p className="mt-1 font-mono text-[10.5px] text-ambar">
                        falta: {o.documentosFaltando.map((t) => tipoDocumentoLabel[t]).join(", ")}
                      </p>
                    ) : (
                      <p className="mt-1 font-mono text-[10.5px] text-verde">documentação básica ok</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
