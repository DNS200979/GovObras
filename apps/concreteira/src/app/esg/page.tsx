import Link from "next/link";
import { Badge } from "@carbonfree/ui/badge";
import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { categoriaLabel, listConcreteiraEsg, statusLabel } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  rascunho: "default",
  publicado: "ativo",
};

export default async function EsgPage() {
  const itens = await listConcreteiraEsg();

  return (
    <ConcreteiraShell active="/esg">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <CardEyebrow>ESG · Certificações e políticas</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Scorecard ESG
          </h1>
        </div>
        <Link
          href="/esg/novo"
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Novo item
        </Link>
      </div>

      {itens.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-[13.5px] text-texto-fraco">
            Nenhum item ESG cadastrado ainda. Documente certificações, políticas ambientais e
            sociais aqui — quando publicado, o item fica visível pras construtoras que vinculam
            sua concreteira a uma obra.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {itens.map((p) => (
            <Link key={p.id} href={`/esg/${p.id}`}>
              <Card className="transition-colors hover:border-verde">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[14px] font-bold text-texto">{p.titulo}</span>
                      <Badge>{categoriaLabel[p.categoria] ?? p.categoria}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                      {new Date(p.createdAt).toLocaleDateString("pt-BR")}
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
    </ConcreteiraShell>
  );
}
