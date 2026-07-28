import type { NavItem } from "@carbonfree/ui/app-shell";

export function obraNav(active: string): NavItem[] {
  const items = [
    { label: "Painel", href: "/" },
    { label: "Ingestão fiscal", href: "/#ingestao" },
    { label: "Simulador de decisão", href: "/simulador" },
    { label: "Plano de compensação", href: "/#compensacao" },
    { label: "Dossiê e assinatura", href: "/dossie" },
  ];
  return items.map((item) => ({ ...item, active: item.href === active }));
}
