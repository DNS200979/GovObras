"use client";

interface CarbonBalanceBarProps {
  /** total de emissões (tCO₂e) */
  passivo: number;
  /** total de remoções/reduções reconhecidas (tCO₂e) */
  ativo: number;
  /** intensidade calculada, ex. "172 kgCO₂e/m²" */
  intensidade?: string;
  /** meta da faixa municipal, ex. "≤ 200" */
  meta?: string;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

/**
 * Visualização assinatura do produto: o balanço ativo/passivo de carbono da
 * obra, no mesmo espírito do "razonete" do plano de negócio, mas como
 * componente interativo reutilizável em Gov e Obra.
 */
export function CarbonBalanceBar({ passivo, ativo, intensidade, meta }: CarbonBalanceBarProps) {
  const saldo = passivo - ativo;
  const total = Math.max(passivo, ativo, 1);
  const passivoPct = (passivo / total) * 100;
  const ativoPct = (ativo / total) * 100;

  return (
    <div className="rounded-md border border-linha bg-papel p-5">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ambar">
            Passivo · emissões
          </div>
          <div className="font-mono text-xl font-semibold text-ambar">
            {fmt(passivo)} <span className="text-xs font-normal text-texto-fraco">tCO₂e</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-verde">
            Ativo · remoções
          </div>
          <div className="font-mono text-xl font-semibold text-verde">
            {fmt(ativo)} <span className="text-xs font-normal text-texto-fraco">tCO₂e</span>
          </div>
        </div>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-linha/40">
        <div
          className="h-full bg-ambar transition-all duration-500"
          style={{ width: `${passivoPct}%` }}
        />
        <div
          className="h-full bg-verde transition-all duration-500"
          style={{ width: `${ativoPct}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-ardosia px-4 py-3 text-papel">
        <div>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.1em]">
            Saldo líquido
          </div>
          {intensidade ? (
            <div className="mt-0.5 font-mono text-[10px] text-linha-forte">
              Intensidade: {intensidade}
              {meta ? ` · Meta: ${meta}` : ""}
            </div>
          ) : null}
        </div>
        <div className="font-mono text-2xl font-semibold text-[#E8A24E]">
          {fmt(saldo)} <span className="text-xs text-linha-forte">tCO₂e</span>
        </div>
      </div>
    </div>
  );
}
