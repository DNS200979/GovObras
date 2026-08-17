import { notFound } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { getEntrega } from "@/lib/queries";

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

export default async function EntregaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entrega = await getEntrega(id);
  if (!entrega) notFound();

  return (
    <ConcreteiraShell active="/entregas">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <CardEyebrow>
            {entrega.obraNome} · {new Date(entrega.dataEntrega).toLocaleDateString("pt-BR")}
          </CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            {entrega.volumeM3.toLocaleString("pt-BR")} m³
          </h1>
        </div>
        <Badge tone={statusTone[entrega.status] ?? "default"} className="shrink-0">
          {statusLabel[entrega.status] ?? entrega.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle>Composição declarada</CardTitle>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              O que foi somado ao cimento nesta carga — agregados, aditivos e demais insumos.
            </p>
            {entrega.composicao.length === 0 ? (
              <p className="py-4 text-[13px] text-texto-fraco">Nenhum insumo declarado.</p>
            ) : (
              <ul className="divide-y divide-linha/60">
                {entrega.composicao.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-texto">{c.insumo}</span>
                    <span className="font-mono text-[12px] text-texto-fraco">
                      {c.quantidade.toLocaleString("pt-BR")} {c.unidade}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardTitle>Traço</CardTitle>
            <p className="text-[13.5px] text-texto">
              {entrega.traco || "Não informado."}
            </p>
          </Card>
        </div>
      </div>
    </ConcreteiraShell>
  );
}
