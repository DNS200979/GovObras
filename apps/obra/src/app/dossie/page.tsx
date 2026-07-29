import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { obraNav } from "@/lib/nav";
import { getObraAtual } from "@/lib/queries";

const RANK: Record<string, number> = { rascunho: 0, protocolado: 1, em_analise: 2, homologado: 3, rejeitado: 3 };

export const dynamic = "force-dynamic";

export default async function DossiePage() {
  const { obra, statusInventarioAtual } = await getObraAtual();
  const rank = RANK[statusInventarioAtual] ?? 0;

  const etapas = [
    { nome: "Inventário ISO 14064-1 gerado", concluida: rank >= 0 },
    { nome: "Assinatura do responsável técnico (gov.br)", concluida: rank >= 1 },
    { nome: "Protocolo na prefeitura", concluida: rank >= 2 },
    { nome: "Homologação e emissão do selo", concluida: statusInventarioAtual === "homologado" },
  ];

  return (
    <AppShell
      productName="CARBONFREE OBRA"
      productTag="Construtora · Engenharia"
      nav={obraNav("/dossie")}
    >
      <CardEyebrow>{obra.nome}</CardEyebrow>
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
