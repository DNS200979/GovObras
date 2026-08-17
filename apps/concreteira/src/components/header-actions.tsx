import { HeaderUser } from "@/components/header-user";
import { ThemeToggle } from "@/components/theme-toggle";

/** Cabeçalho comum a todas as telas: alternador de tema + identificação da conta. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <HeaderUser />
    </div>
  );
}
