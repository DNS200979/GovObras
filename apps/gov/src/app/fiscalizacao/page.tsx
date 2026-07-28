import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardTitle, CardEyebrow } from "@carbonfree/ui/card";
import { govNav } from "@/lib/nav";

const agenda = [
  { fiscal: "Marina Costa", obra: "Galpão Logístico Norte", quando: "Hoje · 09:30", status: "Agendada" },
  { fiscal: "Marina Costa", obra: "Edifício Corporate Tower", quando: "Hoje · 14:00", status: "Agendada" },
  { fiscal: "Diego Farias", obra: "Residencial Vista Verde", quando: "Amanhã · 08:00", status: "Agendada" },
  { fiscal: "Diego Farias", obra: "Condomínio Bosque Real", quando: "Concluída ontem", status: "Concluída" },
];

export default function FiscalizacaoPage() {
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
                <div className="font-mono text-[11px] text-texto-fraco">{item.fiscal}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-texto-fraco">{item.quando}</span>
                <Badge tone={item.status === "Concluída" ? "ativo" : "default"}>{item.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
