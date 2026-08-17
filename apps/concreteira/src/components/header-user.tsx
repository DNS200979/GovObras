import { sair } from "@/lib/auth-actions";
import { getSessaoConcreteira } from "@/lib/sessao";

export async function HeaderUser() {
  const sessao = await getSessaoConcreteira();
  if (!sessao) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="font-display text-[12px] font-semibold leading-tight text-texto">{sessao.nome}</div>
        <div className="font-mono text-[10px] leading-tight text-texto-fraco">{sessao.concreteiraNome}</div>
      </div>
      <form action={sair}>
        <button
          type="submit"
          className="rounded-sm border border-linha px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-texto-fraco transition-colors hover:border-ambar hover:text-ambar"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
