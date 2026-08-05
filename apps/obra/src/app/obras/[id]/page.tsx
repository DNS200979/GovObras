import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { getObra } from "@/lib/queries";
import { tipoDocumentoLabel } from "@/lib/documentos";
import { RemoverDocumentoObra, UploadDocumentoObra } from "./documentos";

export const dynamic = "force-dynamic";

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">{rotulo}</p>
      <p className="mt-0.5 truncate text-[13.5px] text-texto">{valor}</p>
    </div>
  );
}

export default async function ObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obra = await getObra(id);
  if (!obra) notFound();

  const temCoordenada = obra.latitude !== null && obra.longitude !== null;

  return (
    <ObraShell active="/obras">
      <div className="mb-6">
        <Link href="/obras" className="font-mono text-[11px] text-texto-fraco hover:text-verde">
          ← Obras
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow>
              {obra.alvaraNumero} · {obra.municipio}
            </CardEyebrow>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
              {obra.nome}
            </h1>
          </div>
          <Badge tone="neutro">{faseLabel[obra.fase] ?? obra.fase}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardTitle>Documentação exigida</CardTitle>
            {obra.documentosFaltando.length > 0 ? (
              <p className="mb-4 rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[12.5px] text-ambar">
                Falta anexar:{" "}
                {obra.documentosFaltando.map((t) => tipoDocumentoLabel[t]).join(", ")}.
              </p>
            ) : (
              <p className="mb-4 rounded-sm border border-verde/40 bg-verde-claro px-3 py-2 text-[12.5px] text-verde">
                Documentação básica completa.
              </p>
            )}

            {obra.documentos.length === 0 ? (
              <p className="py-3 text-[13px] text-texto-fraco">Nenhum documento anexado ainda.</p>
            ) : (
              <ul className="divide-y divide-linha/60">
                {obra.documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{tipoDocumentoLabel[doc.tipo] ?? doc.tipo}</Badge>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-[13px] font-medium text-verde hover:underline"
                          >
                            {doc.nomeArquivo}
                          </a>
                        ) : (
                          <span className="truncate text-[13px] font-medium text-texto">
                            {doc.nomeArquivo}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[10.5px] text-texto-fraco">
                        {doc.descricao ? `${doc.descricao} · ` : ""}
                        {fmtBytes(doc.tamanhoBytes)} ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <RemoverDocumentoObra id={doc.id} storagePath={doc.storagePath} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-linha/60 pt-4">
              <UploadDocumentoObra obraId={obra.id} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Dados da obra</CardTitle>
            <div className="grid gap-3">
              <Dado rotulo="Tipologia" valor={obra.tipologia} />
              <Dado
                rotulo="Área construída"
                valor={`${obra.areaM2.toLocaleString("pt-BR")} m²`}
              />
              <Dado rotulo="Município" valor={obra.municipio} />
              <Dado rotulo="Alvará" valor={obra.alvaraNumero} />
              <Dado rotulo="Inscrição imobiliária" valor={obra.inscricaoImobiliaria ?? "—"} />
              <Dado rotulo="CNO / CEI" valor={obra.cno ?? "—"} />
              <Dado
                rotulo="Coordenadas"
                valor={
                  temCoordenada
                    ? `${obra.latitude!.toFixed(5)}, ${obra.longitude!.toFixed(5)}`
                    : "não informadas"
                }
              />
            </div>

            {temCoordenada ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${obra.latitude}&mlon=${obra.longitude}#map=17/${obra.latitude}/${obra.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-mono text-[11px] text-verde hover:underline"
              >
                ver no mapa →
              </a>
            ) : null}
          </Card>
        </div>
      </div>
    </ObraShell>
  );
}
