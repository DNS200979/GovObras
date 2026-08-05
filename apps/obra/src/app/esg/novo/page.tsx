import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listObrasConstrutora, listRequisitosAuditoria } from "@/lib/queries";
import { NovoProjetoForm } from "./novo-form";

export const dynamic = "force-dynamic";

export default async function NovoProjetoEsgPage() {
  const [obras, requisitos] = await Promise.all([listObrasConstrutora(), listRequisitosAuditoria()]);

  return (
    <ObraShell active="/esg">
      <CardEyebrow>ESG · Novo projeto</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Novo projeto ESG
      </h1>

      <Card className="max-w-xl">
        {obras.length === 0 ? (
          <p className="text-[13.5px] text-texto-fraco">
            Nenhuma obra cadastrada para essa construtora ainda — cadastre uma obra com a
            prefeitura antes de enviar um projeto ESG.
          </p>
        ) : (
          <NovoProjetoForm obras={obras} requisitos={requisitos} />
        )}
      </Card>
    </ObraShell>
  );
}
