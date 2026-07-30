import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/agendamento", label: "Agendamento", icon: CalendarCheck },
  { href: "/requisitos", label: "Requisitos auditáveis", icon: ClipboardCheck },
];

export function AppShell({
  active,
  children,
  headerRight,
}: {
  active: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-primary px-2 py-1 font-display text-[13px] font-black tracking-wide text-primary-foreground">
              GOV
            </span>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-display text-[13px] font-bold leading-tight text-sidebar-foreground">
                CarbonFree
              </span>
              <span className="font-mono text-[10px] leading-tight text-sidebar-foreground/60">
                Florianópolis · SC
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Programa municipal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={item.href === active}
                      tooltip={item.label}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Prefeitura · Secretarias
          </span>
          <div className="ml-auto flex items-center gap-3">{headerRight}</div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
