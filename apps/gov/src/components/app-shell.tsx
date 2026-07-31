import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Factory,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react";
import { createServerSupabase } from "@carbonfree/database/server";
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
import { UserMenu } from "@/components/user-menu";

const nav = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/construtoras", label: "Construtoras", icon: Factory },
  { href: "/agendamento", label: "Agendamento", icon: CalendarCheck },
  { href: "/requisitos", label: "Requisitos auditáveis", icon: ClipboardCheck },
];

export async function AppShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfil: { nome: string; papel: string } | null = null;
  if (user) {
    const { data } = await supabase.from("perfis").select("nome, papel").eq("id", user.id).single();
    perfil = data;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/mbv-logo.png"
              alt="MBV"
              width={28}
              height={28}
              className="shrink-0 rounded-sm"
            />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-display text-[13px] font-bold leading-tight text-sidebar-foreground">
                CarbonFree
              </span>
              <span className="font-mono text-[10px] leading-tight text-sidebar-foreground/60">
                MBV · Movimento Brasil Verde
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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Prefeitura · Secretarias
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              ao vivo
            </span>
            {user && perfil ? (
              <UserMenu nome={perfil.nome} email={user.email ?? ""} papel={perfil.papel} />
            ) : null}
          </div>
        </header>
        <main className="flex-1 p-5 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
