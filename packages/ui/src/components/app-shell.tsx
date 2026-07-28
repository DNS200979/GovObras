import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
}

interface AppShellProps {
  productName: string;
  productTag: string;
  nav: NavItem[];
  children: ReactNode;
  headerRight?: ReactNode;
}

/** Casca de aplicação padrão: sidebar de navegação + área de conteúdo. */
export function AppShell({ productName, productTag, nav, children, headerRight }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-concreto text-texto">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-linha bg-ardosia px-4 py-6 text-papel md:flex">
        <div className="mb-8">
          <div className="font-display text-[13px] font-black tracking-wide">
            <span className="rounded-sm bg-verde px-2 py-1 text-papel">{productName}</span>
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-linha-forte">
            {productTag}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2 font-display text-[13px] font-medium text-linha-forte transition-colors hover:bg-ardosia-2 hover:text-papel",
                item.active && "bg-ardosia-2 text-papel",
              )}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-linha bg-papel px-6 py-3 md:px-8">
          <div className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-texto-fraco md:hidden">
            {productName}
          </div>
          <div className="ml-auto flex items-center gap-3">{headerRight}</div>
        </header>
        <main className="flex-1 px-6 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
