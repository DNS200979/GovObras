import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import { categoriaEsgLabel, getProjetoEsgGov, statusEsgLabel } from "@/lib/queries";
import { DecidirButtons, MarcarEmAnaliseButton } from "./decisao";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  enviado: "secondary",
  em_analise: "warning",
  aprovado: "success",
  rejeitado: "destructive",
};

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProjetoEsgGovPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projeto = await getProjetoEsgGov(id);
  if (!projeto) notFound();

  return (
    <AppShell active="/esg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {projeto.construtora} · {projeto.obra} · {projeto.alvaraNumero}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            {projeto.titulo}
          </h1>
        </div>
        <Badge variant={statusVariant[projeto.status] ?? "outline"} className="shrink-0">
          {statusEsgLabel[projeto.status] ?? projeto.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{categoriaEsgLabel[projeto.categoria] ?? projeto.categoria}</Badge>
              <p className="mt-4 text-sm whitespace-pre-wrap">{projeto.descricao}</p>
              {projeto.requisito ? (
                <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  Requisito auditável: {projeto.requisito.codigo} — {projeto.requisito.requisito}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documentos anexados</CardTitle>
            </CardHeader>
            <CardContent>
              {projeto.documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {projeto.documentos.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-primary hover:underline"
                          >
                            {doc.nomeArquivo}
                          </a>
                        ) : (
                          <span className="truncate font-medium">{doc.nomeArquivo}</span>
                        )}
                        <div className="font-mono text-[10.5px] text-muted-foreground">
                          {fmtBytes(doc.tamanhoBytes)} ·{" "}
                          {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {projeto.motivoDecisao ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Motivo da decisão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{projeto.motivoDecisao}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Processo de desconto fiscal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                enviado → em análise → aprovado/rejeitado. A decisão é sempre manual.
              </p>

              {projeto.status === "enviado" ? <MarcarEmAnaliseButton projetoId={projeto.id} /> : null}
              {projeto.status === "em_analise" ? <DecidirButtons projetoId={projeto.id} /> : null}
              {projeto.status === "aprovado" || projeto.status === "rejeitado" ? (
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Processo encerrado
                  {projeto.decidoEm ? ` em ${new Date(projeto.decidoEm).toLocaleDateString("pt-BR")}` : ""}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
