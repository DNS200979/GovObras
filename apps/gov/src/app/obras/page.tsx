import { AppShell } from "@carbonfree/ui/app-shell";
import { Badge } from "@carbonfree/ui/badge";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { govNav } from "@/lib/nav";
import { mesaAnalise, riscoTone } from "@/lib/mock-data";

const tipologias = ["Residencial vertical", "Comercial", "Galpão logístico", "Residencial horizontal"];

const obras = mesaAnalise.map((o, i) => ({
  ...o,
  tipologia: tipologias[i % tipologias.length],
  areaM2: 3_200 + i * 1_450,
  fase: ["Fundação", "Estrutura", "Acabamento", "Entrega"][i % 4],
}));

export default function ObrasPage() {
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
                <tr key={row.id} className="border-b border-linha/60 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-texto">{row.obra}</div>
                    <div className="font-mono text-[11px] text-texto-fraco">
                      {row.id} · {row.construtora}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-texto-fraco">{row.tipologia}</td>
                  <td className="py-2.5 pr-3 font-mono">{row.areaM2.toLocaleString("pt-BR")} m²</td>
                  <td className="py-2.5 pr-3 text-texto-fraco">{row.fase}</td>
                  <td className="py-2.5 pr-3 font-mono">{row.intensidade} kg/m²</td>
                  <td className="py-2.5">
                    <Badge tone={riscoTone[row.risco]}>{row.risco}</Badge>
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
