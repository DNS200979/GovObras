import Image from "next/image";
import { AppShell } from "@carbonfree/ui/app-shell";
import { HeaderActions } from "@carbonfree/ui/header-actions";
import { HeaderUser } from "@/components/header-user";
import { obraNav } from "@/lib/nav";

/**
 * Casca das telas da construtora — concentra marca, navegação e cabeçalho
 * num lugar só, para renomear ou trocar o logo sem passar por cada página.
 */
export function ObraShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <AppShell
      productName="MBV CONSTRUTORAS"
      productTag="Construtora · Engenharia"
      logo={
        <Image
          src="/mbv-logo.png"
          alt="MBV"
          width={26}
          height={26}
          className="shrink-0 rounded-sm"
        />
      }
      nav={obraNav(active)}
      headerRight={
        <HeaderActions>
          <HeaderUser />
        </HeaderActions>
      }
    >
      {children}
    </AppShell>
  );
}
