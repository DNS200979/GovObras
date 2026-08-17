import { ConcreteiraShell } from "@/components/concreteira-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { NovoItemEsgForm } from "./novo-form";

export const dynamic = "force-dynamic";

export default async function NovoItemEsgPage() {
  return (
    <ConcreteiraShell active="/esg">
      <CardEyebrow>ESG · Novo item</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-texto">
        Novo item ESG
      </h1>

      <Card className="max-w-xl">
        <NovoItemEsgForm />
      </Card>
    </ConcreteiraShell>
  );
}
