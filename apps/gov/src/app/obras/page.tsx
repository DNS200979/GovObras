import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { govNav } from "@/lib/nav";
import { getObrasList } from "@/lib/queries";

const riscoTone = { baixo: "ativo", medio: "neutro", alto: "passivo" } as const;

function risco(intensidade: number): keyof typeof riscoTone {
  if (intensidade > 380) return "alto";
  if (intensidade > 250) return "medio";
  return "baixo";
}

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const obras = await getObrasList();

  return (
    <AppShell productName="CARBONFREE GOV" productTag="Prefeitura · Secretarias" nav={govNav("/obras")}>
      <CardEyebrow>Cadastro</CardEyebrow>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight text-ardosia">
        Obras licenciadas
      </h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-linha text-[11px] uppercase tracking-wide text-texto-fraco">
                <th className="py-2 pr-3 font-display font-bold">Obra</th>
                <th className="py-2 pr-3 font-display font-bold">Tipologia</th>
                <th className="py-2 pr-3 font-display font-bold">Área</th>
                <th className="py-2 pr-3 font-display font-bold">Fase</th>
                <th className="py-2 pr-3 font-display font-bold">Intensidade</th>
                <th className="py-2 font-display font-bold">Risco</th>
              </tr>
            </thead>
            <tbody>
              {obras.map((row) => (
                <tr key={row.obraId} className="border-b border-linha/60 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-texto">{row.nome}</div>
                    <div className="font-mono text-[11px] text-texto-fraco">
                      {row.alvara} · {row.construtora}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-texto-fraco">{row.tipologia}</td>
                  <td className="py-2.5 pr-3 font-mono">{row.areaM2.toLocaleString("pt-BR")} m²</td>
                  <td className="py-2.5 pr-3 text-texto-fraco">{faseLabel[row.fase] ?? row.fase}</td>
                  <td className="py-2.5 pr-3 font-mono">{row.intensidade} kg/m²</td>
                  <td className="py-2.5">
                    <Badge tone={riscoTone[risco(row.intensidade)]}>{risco(row.intensidade)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
