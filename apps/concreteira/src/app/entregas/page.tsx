import Link from "next/link";
import { Badge } from "@carbonfree/ui/badge";
import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listEntregas } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  declarada: "Declarada",
  validada: "Validada",
  contestada: "Contestada",
};

const statusTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  declarada: "neutro",
  validada: "ativo",
  contestada: "passivo",
};

export default async function EntregasPage() {
  const entregas = await listEntregas();

  return (
    <ConcreteiraShell active="/entregas">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <CardEyebrow>Rastreabilidade de mistura</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            Entregas
          </h1>
        </div>
        <Link
          href="/entregas/nova"
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90"
        >
          Declarar entrega
        </Link>
      </div>

      {entregas.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-[13.5px] text-texto-fraco">
            Nenhuma entrega declarada ainda. A cada carga de concreto que sair pra uma obra
            vinculada, declare o volume e o que foi somado ao cimento — é isso que alimenta a
            rastreabilidade do carbono do concreto.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entregas.map((e) => (
            <Link key={e.id} href={`/entregas/${e.id}`}>
              <Card className="transition-colors hover:border-verde">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-display text-[14px] font-bold text-texto">
                      {e.obraNome}
                    </span>
                    <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                      {e.volumeM3.toLocaleString("pt-BR")} m³ ·{" "}
                      {new Date(e.dataEntrega).toLocaleDateString("pt-BR")} · {e.totalInsumos}{" "}
                      {e.totalInsumos === 1 ? "insumo declarado" : "insumos declarados"}
                    </p>
                  </div>
                  <Badge tone={statusTone[e.status] ?? "default"}>
                    {statusLabel[e.status] ?? e.status}
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
