import { AppShell } from "@carbonfree/ui/app-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { DecisionSimulator } from "@/components/decision-simulator";
import { obraNav } from "@/lib/nav";
import { alternativas } from "@/lib/mock-data";

export default function SimuladorPage() {
  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/simulador")}
    >
      <CardEyebrow>Antes de comprar</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-ardosia">
        Simulador de decisão
      </h1>

      <Card>
        <DecisionSimulator alternativas={alternativas} />
      </Card>
    </AppShell>
  );
}
