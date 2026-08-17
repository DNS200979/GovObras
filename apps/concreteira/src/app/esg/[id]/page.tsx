import { notFound } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { categoriaLabel, getConcreteiraEsgItem, statusLabel } from "@/lib/queries";
import { DespublicarItemButton, ExcluirRascunhoButton, PublicarItemButton, RemoverDocumentoButton } from "./acoes";
import { UploadDocumentoForm } from "./upload-form";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  rascunho: "default",
  publicado: "ativo",
};

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ItemEsgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getConcreteiraEsgItem(id);
  if (!item) notFound();

  return (
    <ConcreteiraShell active="/esg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <CardEyebrow>{categoriaLabel[item.categoria] ?? item.categoria}</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            {item.titulo}
          </h1>
        </div>
        <Badge tone={statusTone[item.status] ?? "default"} className="shrink-0">
          {statusLabel[item.status] ?? item.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardTitle>Descrição</CardTitle>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-texto">
              {item.descricao}
            </p>
          </Card>

          <Card>
            <CardTitle>Documentos</CardTitle>
            {item.documentos.length === 0 ? (
              <p className="py-4 text-[13px] text-texto-fraco">Nenhum documento anexado ainda.</p>
            ) : (
              <ul className="divide-y divide-linha/60">
                {item.documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium text-verde hover:underline"
                        >
                          {doc.nomeArquivo}
                        </a>
                      ) : (
                        <span className="truncate font-medium text-texto">{doc.nomeArquivo}</span>
                      )}
                      <div className="font-mono text-[10.5px] text-texto-fraco">
                        {fmtBytes(doc.tamanhoBytes)} ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <RemoverDocumentoButton documentoId={doc.id} itemId={item.id} storagePath={doc.storagePath} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-linha/60 pt-4">
              <UploadDocumentoForm itemId={item.id} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Visibilidade</CardTitle>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              Enquanto rascunho, só sua concreteira vê este item. Publicado, ele fica visível pras
              construtoras que vincularam sua concreteira a alguma obra.
            </p>
            <div className="grid gap-2">
              {item.status === "rascunho" ? (
                <>
                  <PublicarItemButton itemId={item.id} />
                  <ExcluirRascunhoButton itemId={item.id} />
                </>
              ) : (
                <DespublicarItemButton itemId={item.id} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </ConcreteiraShell>
  );
}
