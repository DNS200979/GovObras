import type { NavItem } from "@carbonfree/ui/app-shell";

export function obraNav(active: string): NavItem[] {
  const items = [
    { label: "Projetos ESG", href: "/esg" },
    { label: "Painel de carbono", href: "/painel" },
    { label: "Simulador de decisão", href: "/simulador" },
    { label: "Dossiê e assinatura", href: "/dossie" },
  ];
  return items.map((item) => ({ ...item, active: item.href === active }));
}
