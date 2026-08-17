import Link from "next/link";
import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listConcreteirasVinculadas } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  convidado: "Convidado",
  ativo: "Ativo",
  encerrado: "Encerrado",
};

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  convidado: "neutro",
  ativo: "ativo",
  encerrado: "default",
};

export default async function ConcreteirasPage() {
  const vinculos = await listConcreteirasVinculadas();

  return (
    <ObraShell active="/concreteiras">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <CardEyebrow>Cadeia de suprimento · Concreto</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Concreteiras
          </h1>
        </div>
        <Link
          href="/concreteiras/nova"
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Vincular concreteira
        </Link>
      </div>

      {vinculos.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-[13.5px] text-texto-fraco">
            Nenhuma concreteira vinculada ainda. Vincule as concreteiras que fornecem concreto pras
            suas obras pra rastrear o que elas somam ao cimento e acompanhar o ESG delas também.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vinculos.map((v) => (
            <Link key={v.id} href={`/concreteiras/${v.id}`}>
              <Card className="transition-colors hover:border-verde">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-display text-[14px] font-bold text-texto">
                      {v.razaoSocial}
                    </span>
                    <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                      {v.obraNome} · CNPJ {v.cnpj} · {v.totalEntregas}{" "}
                      {v.totalEntregas === 1 ? "entrega declarada" : "entregas declaradas"}
                    </p>
                  </div>
                  <Badge tone={statusTone[v.status] ?? "default"}>
                    {statusLabel[v.status] ?? v.status}
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
