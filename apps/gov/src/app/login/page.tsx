import { LoginForm } from "./login-form";
import { MiniRazonete } from "./mini-razonete";

const bases = [
  { label: "Base regulatória", value: "Lei 15.042/2024 · CONAMA 307 · Lei 14.133/2021" },
  { label: "Norma de cálculo", value: "ISO 14064-1 · EN 15978 · GHG Protocol BR" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[var(--color-ardosia)] px-14 py-12 text-[var(--color-papel)] lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-ardosia-2) 1px, transparent 1px), linear-gradient(90deg, var(--color-ardosia-2) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex items-baseline gap-3">
          <span className="rounded-sm bg-[var(--color-verde)] px-2.5 py-1 font-display text-[14px] font-black tracking-wide text-[var(--color-papel)]">
            CARBONFREE GOV
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-linha-forte)]">
            Prefeitura · Secretarias
          </span>
        </div>

        <h1 className="relative mt-12 max-w-md font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-[var(--color-papel)]">
          Toda obra tem um <span className="text-[#5FBFA3]">balanço de carbono</span>.
        </h1>
        <p className="relative mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--color-linha-forte)]">
          Painel de comando do programa municipal: cadastro de obras, mesa de análise,
          homologação de selos e agendamento de fiscalização.
        </p>

        <div className="relative mt-8 max-w-sm">
          <MiniRazonete />
        </div>

        <div className="relative mt-auto flex flex-col gap-4 border-t border-[var(--color-ardosia-2)] pt-6">
          {bases.map((b) => (
            <div key={b.label} className="font-mono text-[11px] text-[var(--color-linha-forte)]">
              {b.label}
              <div className="mt-1 text-[13px] text-[var(--color-papel)]">{b.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="rounded-sm bg-primary px-2 py-1 font-display text-[13px] font-black tracking-wide text-primary-foreground">
              CARBONFREE GOV
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-7 shadow-sm">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Acesso restrito
            </p>
            <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight">
              Entrar no painel
            </h2>
            {erro === "papel" ? (
              <p className="mb-4 rounded-sm border border-[var(--color-ambar)]/40 bg-[var(--color-ambar)]/10 px-3 py-2 text-[13px] text-[var(--color-ambar)]">
                Esta conta não é da prefeitura. Contas de construtora acessam o CarbonFree Obra.
              </p>
            ) : null}
            <LoginForm next={next ?? "/"} />
          </div>

          <p className="mt-6 text-center font-mono text-[10.5px] tracking-wide text-muted-foreground">
            CarbonFree Obras · MBV · Movimento Brasil Verde
          </p>
        </div>
      </div>
    </div>
  );
}
