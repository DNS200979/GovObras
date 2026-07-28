import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { obraNav } from "@/lib/nav";
import { obraAtual } from "@/lib/mock-data";

const etapas = [
  { nome: "Inventário ISO 14064-1 gerado", concluida: true },
  { nome: "Assinatura do responsável técnico (gov.br)", concluida: false },
  { nome: "Protocolo na prefeitura", concluida: false },
  { nome: "Homologação e emissão do selo", concluida: false },
];

export default function DossiePage() {
  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/dossie")}
    >
      <CardEyebrow>{obraAtual.nome}</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-ardosia">
        Dossiê e assinatura
      </h1>

      <Card>
        <CardTitle>Trâmite</CardTitle>
        <ul className="divide-y divide-linha/60">
          {etapas.map((etapa) => (
            <li key={etapa.nome} className="flex items-center justify-between py-3 text-[13.5px]">
              <span className={etapa.concluida ? "text-texto" : "text-texto-fraco"}>{etapa.nome}</span>
              <Badge tone={etapa.concluida ? "ativo" : "default"}>
                {etapa.concluida ? "Concluída" : "Pendente"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
