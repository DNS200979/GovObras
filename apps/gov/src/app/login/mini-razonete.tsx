const passivo = [
  { desc: "Cimento e concreto usinado", val: 1284 },
  { desc: "Aço CA-50 / CA-60", val: 742 },
  { desc: "Alvenaria, transporte e energia", val: 682 },
  { desc: "Supressão vegetal autorizada", val: 47 },
];

const ativo = [
  { desc: "Substituição por CP III/CP IV", val: 386 },
  { desc: "Agregado reciclado e fotovoltaica", val: 125 },
  { desc: "CRVE aposentados em registro", val: 450 },
  { desc: "Compensação arbórea e madeira", val: 180 },
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Mesma amostra do plano de negócio — residencial vertical, 9.400 m². */
export function MiniRazonete() {
  return (
    <div className="relative rounded-md bg-[var(--color-papel)] p-5 text-[var(--color-texto)] shadow-[0_-2px_0_var(--color-verde)]">
      <div className="mb-3 flex items-baseline justify-between border-b-2 border-[var(--color-ardosia)] pb-2">
        <span className="font-display text-[13px] font-extrabold tracking-tight">
          Balanço de Carbono da Obra
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--color-texto-fraco)]">
          exemplo · 9.400 m²
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1.5 font-display text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-ambar)]">
            Passivo
          </div>
          {passivo.map((l) => (
            <div key={l.desc} className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
              <span className="truncate text-[var(--color-texto-fraco)]">{l.desc}</span>
              <span className="shrink-0 font-mono text-[var(--color-ambar)]">{fmt(l.val)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1.5 font-display text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-verde)]">
            Ativo
          </div>
          {ativo.map((l) => (
            <div key={l.desc} className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
              <span className="truncate text-[var(--color-texto-fraco)]">{l.desc}</span>
              <span className="shrink-0 font-mono text-[var(--color-verde)]">{fmt(l.val)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md bg-[var(--color-ardosia)] px-4 py-2.5">
        <span className="font-display text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-papel)]">
          Saldo líquido
        </span>
        <span className="font-mono text-lg font-semibold text-[#E8A24E]">
          1.614 <span className="text-[10px] text-[var(--color-linha-forte)]">tCO₂e</span>
        </span>
      </div>
    </div>
  );
}
