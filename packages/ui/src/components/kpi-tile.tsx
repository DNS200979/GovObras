import { cn } from "../lib/cn";

interface KpiTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; positive: boolean };
  className?: string;
}

/** Ladrilho de indicador para o topo dos dashboards (Gov e Obra). */
export function KpiTile({ label, value, unit, delta, className }: KpiTileProps) {
  return (
    <div className={cn("rounded-md border border-linha bg-papel p-4", className)}>
      <div className="font-mono text-2xl font-semibold leading-none text-texto">
        {value}
        {unit ? <span className="ml-1 text-xs font-normal text-texto-fraco">{unit}</span> : null}
      </div>
      <div className="mt-2 text-[12.5px] leading-snug text-texto-fraco">{label}</div>
      {delta ? (
        <div
          className={cn(
            "mt-1.5 font-mono text-[11px]",
            delta.positive ? "text-verde" : "text-ambar",
          )}
        >
          {delta.positive ? "▲" : "▼"} {delta.value}
        </div>
      ) : null}
    </div>
  );
}
