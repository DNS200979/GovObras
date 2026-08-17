import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listObrasConstrutora } from "@/lib/queries";
import { NovaConcreteiraForm } from "./nova-form";

export const dynamic = "force-dynamic";

export default async function NovaConcreteiraPage() {
  const obras = await listObrasConstrutora();

  return (
    <ObraShell active="/concreteiras">
      <CardEyebrow>Concreteiras · Vincular</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Vincular concreteira
      </h1>

      <Card className="max-w-xl">
        {obras.length === 0 ? (
          <p className="text-[13.5px] text-texto-fraco">
            Nenhuma obra cadastrada ainda — cadastre uma obra com a prefeitura antes de vincular
            uma concreteira a ela.
          </p>
        ) : (
          <NovaConcreteiraForm obras={obras} />
        )}
      </Card>
    </ObraShell>
  );
}
