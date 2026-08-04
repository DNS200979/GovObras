import type { NavItem } from "@carbonfree/ui/app-shell";

export function obraNav(active: string): NavItem[] {
  const items = [
    { label: "Painel", href: "/" },
    { label: "Simulador de decisão", href: "/simulador" },
    { label: "Dossiê e assinatura", href: "/dossie" },
    { label: "Projetos ESG", href: "/esg" },
  ];
  return items.map((item) => ({ ...item, active: item.href === active }));
}
