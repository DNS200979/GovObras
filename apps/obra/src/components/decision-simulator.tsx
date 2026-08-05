"use client";

import { useMemo, useState } from "react";
import { Badge } from "@carbonfree/ui/badge";
import type { Alternativa } from "@/lib/queries";

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * "A tela que a construtora usa antes de comprar" (seção 07 do plano):
 * ordena alternativas de material por R$ por tCO₂e evitado, com quantidade
 * ajustável em tempo real.
 */
export function DecisionSimulator({ alternativas }: { alternativas: Alternativa[] }) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    Object.fromEntries(alternativas.map((a) => [a.id, 10])),
  );

  const linhas = useMemo(() => {
    return alternativas
      .map((a) => {
        const qtd = quantidades[a.id] ?? 0;
        const custoTotal = a.custoAdicionalPorUnidade * qtd;
        const tco2eTotal = a.tco2eEvitadoPorUnidade * qtd;
        const custoPorTco2e = tco2eTotal > 0 ? custoTotal / tco2eTotal : Infinity;
        return { ...a, qtd, custoTotal, tco2eTotal, custoPorTco2e };
      })
      .sort((a, b) => a.custoPorTco2e - b.custoPorTco2e);
  }, [alternativas, quantidades]);

  const totalEvitado = linhas.reduce((acc, l) => acc + l.tco2eTotal, 0);
  const totalCusto = linhas.reduce((acc, l) => acc + l.custoTotal, 0);

  return (
    <div>
      <div className="space-y-5">
        {linhas.map((l, i) => (
          <div key={l.id} className="border-b border-linha/60 pb-5 last:border-0 last:pb-0">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {i === 0 && l.tco2eTotal > 0 ? (
                    <Badge tone="ativo">melhor custo-benefício</Badge>
                  ) : null}
                  <span className="font-medium text-texto">{l.material}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-texto-fraco">
                  em substituição a {l.original}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-texto">
                  {l.tco2eTotal > 0 ? fmtBRL(l.custoPorTco2e) : "—"}
                  <span className="ml-1 text-[11px] font-normal text-texto-fraco">/tCO₂e</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={l.qtd}
                onChange={(e) =>
                  setQuantidades((q) => ({ ...q, [l.id]: Number(e.target.value) }))
                }
                className="h-[3px] flex-1 cursor-pointer appearance-none rounded-full bg-linha accent-verde"
              />
              <span className="w-28 shrink-0 text-right font-mono text-[12px] text-texto-fraco">
                {l.qtd} {l.unidade}
              </span>
            </div>

            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-texto-fraco">
              <span>{fmtBRL(l.custoTotal)} de custo adicional</span>
              <span>{l.tco2eTotal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tCO₂e evitado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Faixa escura nos dois temas — cores fixas, senão o texto some no escuro. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-ardosia px-5 py-4 text-[#f8f9f6]">
        <div>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.1em]">
            Total do plano simulado
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-[#9aa69c]">
            {fmtBRL(totalCusto)} de investimento adicional
          </div>
        </div>
        <div className="font-mono text-2xl font-semibold text-[#5FBFA3]">
          {totalEvitado.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
          <span className="text-xs text-[#9aa69c]">tCO₂e evitado</span>
        </div>
      </div>
    </div>
  );
}
