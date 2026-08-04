import { AppShell } from "@carbonfree/ui/app-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { HeaderUser } from "@/components/header-user";
import { obraNav } from "@/lib/nav";
import { listObrasConstrutora } from "@/lib/queries";
import { NovoProjetoForm } from "./novo-form";

export const dynamic = "force-dynamic";

export default async function NovoProjetoEsgPage() {
  const obras = await listObrasConstrutora();

  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/esg")}
      headerRight={<HeaderUser />}
    >
      <CardEyebrow>ESG · Novo projeto</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-ardosia">
        Novo projeto ESG
      </h1>

      <Card className="max-w-xl">
        {obras.length === 0 ? (
          <p className="text-[13.5px] text-texto-fraco">
            Nenhuma obra cadastrada para essa construtora ainda — cadastre uma obra com a
            prefeitura antes de enviar um projeto ESG.
          </p>
        ) : (
          <NovoProjetoForm obras={obras} />
        )}
      </Card>
    </AppShell>
  );
}
