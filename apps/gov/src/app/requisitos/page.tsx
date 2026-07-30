import { AppShell } from "@/components/app-shell";
import { getRequisitosAuditoria } from "@/lib/queries";
import { RequisitosClient } from "./requisitos-client";

export const dynamic = "force-dynamic";

export default async function RequisitosPage() {
  const requisitos = await getRequisitosAuditoria();

  return (
    <AppShell active="/requisitos">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Núcleo do produto
      </p>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight">
        Requisitos auditáveis
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        A pergunta que define o produto: o que exatamente o fiscal pode checar e contestar? Cada
        linha é um requisito com unidade, evidência primária e teste de verificação.
      </p>

      <RequisitosClient requisitos={requisitos} />
    </AppShell>
  );
}
