import { AppShell } from "@carbonfree/ui/app-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { DecisionSimulator } from "@/components/decision-simulator";
import { HeaderActions } from "@/components/header-actions";
import { obraNav } from "@/lib/nav";
import { getAlternativasMaterial } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const alternativas = await getAlternativasMaterial();

  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/simulador")}
      headerRight={<HeaderActions />}
    >
      <CardEyebrow>Antes de comprar</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Simulador de decisão
      </h1>

      <Card>
        <DecisionSimulator alternativas={alternativas} />
      </Card>
    </AppShell>
  );
}
