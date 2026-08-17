import { Badge } from "@carbonfree/ui/badge";
import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listObrasVinculadas } from "@/lib/queries";

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

export default async function ObrasPage() {
  const obras = await listObrasVinculadas();

  return (
    <ConcreteiraShell active="/obras">
      <div className="mb-6">
        <CardEyebrow>Cadeia de suprimento · Concreto</CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
          Obras vinculadas
        </h1>
      </div>

      {obras.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-[13.5px] text-texto-fraco">
            Nenhuma obra vinculada ainda. O vínculo é criado pela construtora, no painel dela —
            assim que ela vincular sua concreteira a uma obra, ela aparece aqui.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {obras.map((o) => (
            <Card key={o.vinculoId}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-display text-[14px] font-bold text-texto">
                    {o.obraNome}
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-texto-fraco">
                    Alvará {o.alvaraNumero} · {o.totalEntregas}{" "}
                    {o.totalEntregas === 1 ? "entrega declarada" : "entregas declaradas"}
                  </p>
                </div>
                <Badge tone={statusTone[o.status] ?? "default"}>
                  {statusLabel[o.status] ?? o.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ConcreteiraShell>
  );
}
