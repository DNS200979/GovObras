import { notFound } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { categoriaLabel, getProjetoEsg, statusLabel } from "@/lib/queries";
import { EnviarParaAnaliseButton, ExcluirRascunhoButton, RemoverDocumentoButton } from "./acoes";
import { UploadDocumentoForm } from "./upload-form";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  rascunho: "default",
  enviado: "neutro",
  em_analise: "neutro",
  aprovado: "ativo",
  rejeitado: "passivo",
};

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProjetoEsgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projeto = await getProjetoEsg(id);
  if (!projeto) notFound();

  const editavel = projeto.status === "rascunho" || projeto.status === "enviado";
  const podeAnexar = projeto.status === "rascunho" || projeto.status === "enviado";

  return (
    <ObraShell active="/esg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <CardEyebrow>
            {projeto.obraNome} · {categoriaLabel[projeto.categoria] ?? projeto.categoria}
          </CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            {projeto.titulo}
          </h1>
        </div>
        <Badge tone={statusTone[projeto.status] ?? "default"} className="shrink-0">
          {statusLabel[projeto.status] ?? projeto.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardTitle>Descrição</CardTitle>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-texto">
              {projeto.descricao}
            </p>
            {projeto.requisito ? (
              <p className="mt-3 border-t border-linha/60 pt-3 font-mono text-[11px] text-texto-fraco">
                Requisito auditável: {projeto.requisito.codigo} — {projeto.requisito.requisito}
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Documentos</CardTitle>
            {projeto.documentos.length === 0 ? (
              <p className="py-4 text-[13px] text-texto-fraco">Nenhum documento anexado ainda.</p>
            ) : (
              <ul className="divide-y divide-linha/60">
                {projeto.documentos.map((doc) => (
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
                    {projeto.status === "rascunho" ? (
                      <RemoverDocumentoButton
                        documentoId={doc.id}
                        projetoId={projeto.id}
                        storagePath={doc.storagePath}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {podeAnexar ? (
              <div className="mt-4 border-t border-linha/60 pt-4">
                <UploadDocumentoForm projetoId={projeto.id} />
              </div>
            ) : null}
          </Card>

          {projeto.motivoDecisao ? (
            <Card>
              <CardTitle>Retorno da prefeitura</CardTitle>
              <p className="text-[13.5px] text-texto">{projeto.motivoDecisao}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Processo de desconto fiscal</CardTitle>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              O status muda conforme a prefeitura avalia a documentação: enviado → em análise →
              aprovado ou rejeitado.
            </p>
            {projeto.status === "rascunho" ? (
              <div className="grid gap-2">
                <EnviarParaAnaliseButton
                  projetoId={projeto.id}
                  disabled={projeto.documentos.length === 0}
                />
                {projeto.documentos.length === 0 ? (
                  <p className="font-mono text-[10.5px] text-texto-fraco">
                    Anexe ao menos um documento para enviar.
                  </p>
                ) : null}
                <ExcluirRascunhoButton projetoId={projeto.id} />
              </div>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-wide text-texto-fraco">
                {editavel ? "Aguardando análise da prefeitura" : "Processo encerrado"}
              </p>
            )}
          </Card>
        </div>
      </div>
    </ObraShell>
  );
}
