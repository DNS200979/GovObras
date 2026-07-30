import { AppShell } from "@/components/app-shell";
import { getFiscais, getFiscalizacoes, getObrasParaSelect } from "@/lib/queries";
import { AgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

export default async function AgendamentoPage() {
  const [fiscalizacoes, obras, fiscais] = await Promise.all([
    getFiscalizacoes(),
    getObrasParaSelect(),
    getFiscais(),
  ]);

  return (
    <AppShell active="/agendamento">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Programação de vistorias
      </p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight">Agendamento</h1>

      <AgendaClient fiscalizacoes={fiscalizacoes} obras={obras} fiscais={fiscais} />
    </AppShell>
  );
}
