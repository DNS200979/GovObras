import type { NavItem } from "@carbonfree/ui/app-shell";

export function govNav(active: string): NavItem[] {
  const items = [
    { label: "Painel", href: "/" },
    { label: "Obras", href: "/obras" },
    { label: "Mesa de análise", href: "/#mesa-analise" },
    { label: "Fiscalização", href: "/fiscalizacao" },
    { label: "Régua de incentivo", href: "/#regua" },
    { label: "Transparência", href: "/#transparencia" },
  ];
  return items.map((item) => ({ ...item, active: item.href === active }));
}
