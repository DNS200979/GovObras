import Link from "next/link";
import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { categoriaLabel, listProjetosEsg, statusLabel } from "@/lib/queries";
import { EsgSubnav } from "./esg-subnav";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  rascunho: "default",
  enviado: "neutro",
  em_analise: "neutro",
  aprovado: "ativo",
  rejeitado: "passivo",
};

export default async function EsgPage() {
  const projetos = await listProjetosEsg();

  return (
    <ObraShell active="/esg">
      <EsgSubnav ativo="/esg" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <CardEyebrow>ESG · Documentação e desconto fiscal</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Projetos ESG
          </h1>
        </div>
        <Link
          href="/esg/novo"
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Novo projeto
        </Link>
      </div>

      {projetos.length === 0 ? (
        <Card>
          <p className="mb-4 text-center text-[13.5px] text-texto-fraco">
            Nenhum projeto ESG enviado ainda. Use documentação ambiental, social ou de governança
            da obra para instruir o processo de desconto fiscal junto à prefeitura.
          </p>
          <p className="text-center">
            <Link href="/esg/guia" className="font-mono text-[12px] text-verde hover:underline">
              não sabe por onde começar? veja o guia →
            </Link>
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projetos.map((p) => (
            <Link key={p.id} href={`/esg/${p.id}`}>
              <Card className="transition-colors hover:border-verde">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[14px] font-bold text-texto">{p.titulo}</span>
                      <Badge>{categoriaLabel[p.categoria] ?? p.categoria}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                      {p.obraNome} · {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      {p.requisitoCodigo ? ` · requisito ${p.requisitoCodigo}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone[p.status] ?? "default"}>
                    {statusLabel[p.status] ?? p.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </ObraShell>
  );
}
