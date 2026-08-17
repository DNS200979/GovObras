import type { NavItem } from "@carbonfree/ui/app-shell";

export function concreteiraNav(active: string): NavItem[] {
  const items = [
    { label: "Obras vinculadas", href: "/obras" },
    { label: "Entregas", href: "/entregas" },
    { label: "ESG", href: "/esg" },
  ];
  return items.map((item) => ({ ...item, active: item.href === active }));
}
