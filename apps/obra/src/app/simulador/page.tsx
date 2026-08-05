import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { DecisionSimulator } from "@/components/decision-simulator";
import { getAlternativasMaterial } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const alternativas = await getAlternativasMaterial();

  return (
    <ObraShell active="/simulador">
      <CardEyebrow>Antes de comprar</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Simulador de decisão
      </h1>

      <Card>
        <DecisionSimulator alternativas={alternativas} />
      </Card>
    </ObraShell>
  );
}
