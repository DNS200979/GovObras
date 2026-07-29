import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardTitle, CardEyebrow } from "@carbonfree/ui/card";
import { govNav } from "@/lib/nav";
import { getFiscalizacoes } from "@/lib/queries";

const statusLabel: Record<string, string> = {
  agendada: "Agendada",
  em_campo: "Em campo",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const dynamic = "force-dynamic";

export default async function FiscalizacaoPage() {
  const agenda = await getFiscalizacoes();

  return (
    <AppShell
      productName="CARBONFREE GOV"
      productTag="Prefeitura · Secretarias"
      nav={govNav("/fiscalizacao")}
    >
      <CardEyebrow>Programação</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-ardosia">
        Fiscalização
      </h1>

      <Card>
        <CardTitle>Agenda dos fiscais</CardTitle>
        <ul className="divide-y divide-linha/60">
          {agenda.map((item, i) => (
            <li key={i} className="flex items-center justify-between py-3 text-[13.5px]">
              <div>
                <div className="font-medium text-texto">{item.obra}</div>
                <div className="font-mono text-[11px] text-texto-fraco">
                  {item.fiscal} · {item.construtora}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-texto-fraco">{item.quando}</span>
                <Badge tone={item.status === "concluida" ? "ativo" : "default"}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
              </div>
            </li>
          ))}
          {agenda.length === 0 && (
            <li className="py-6 text-center text-texto-fraco">Nenhuma vistoria agendada.</li>
          )}
        </ul>
      </Card>
    </AppShell>
  );
}
