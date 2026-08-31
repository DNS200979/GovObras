/**
 * Identificação da conta no cabeçalho — puramente visual.
 *
 * Não lê sessão: cada app tem a sua (construtora, concreteira) e passa os
 * dados já resolvidos, junto com a Server Action de saída.
 */
export function HeaderUser({
  nome,
  organizacao,
  sair,
}: {
  nome: string;
  organizacao: string;
  sair: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="font-display text-[12px] font-semibold leading-tight text-texto">{nome}</div>
        <div className="font-mono text-[10px] leading-tight text-texto-fraco">{organizacao}</div>
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
