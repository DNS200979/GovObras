import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

/**
 * Cabeçalho comum às telas de Obra e Concreteira: alternador de tema mais o
 * bloco de conta. Quem identifica a conta muda por app (a sessão vem de uma
 * tabela diferente), então entra como slot.
 */
export function HeaderActions({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      {children}
    </div>
  );
}
