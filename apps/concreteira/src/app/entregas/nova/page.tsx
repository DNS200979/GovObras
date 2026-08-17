import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listFatoresEmissao, listObrasVinculadasAtivas } from "@/lib/queries";
import { NovaEntregaForm } from "./nova-form";

export const dynamic = "force-dynamic";

export default async function NovaEntregaPage() {
  const [obras, fatores] = await Promise.all([listObrasVinculadasAtivas(), listFatoresEmissao()]);

  return (
    <ConcreteiraShell active="/entregas">
      <CardEyebrow>Entregas · Declarar</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Declarar entrega
      </h1>

      <Card className="max-w-xl">
        {obras.length === 0 ? (
          <p className="text-[13.5px] text-texto-fraco">
            Nenhuma obra ativa vinculada ainda — o vínculo é criado pela construtora no painel
            dela. Assim que ela vincular sua concreteira a uma obra, ela aparece aqui.
          </p>
        ) : (
          <NovaEntregaForm obras={obras} fatores={fatores} />
        )}
      </Card>
    </ConcreteiraShell>
  );
}
