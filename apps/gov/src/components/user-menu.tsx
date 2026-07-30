"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sair } from "@/lib/auth-actions";

const papelLabel: Record<string, string> = {
  prefeitura_gestor: "Gestor do programa",
  prefeitura_analista: "Analista",
  admin_plataforma: "Administrador",
};

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function UserMenu({ nome, email, papel }: { nome: string; email: string; papel: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-8 gap-2 px-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                {iniciais(nome)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{nome}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="font-medium">{nome}</div>
          <div className="font-mono text-[11px] font-normal text-muted-foreground">{email}</div>
          <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
            {papelLabel[papel] ?? papel}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={sair}>
          <DropdownMenuItem
            variant="destructive"
            render={
              <button type="submit" className="w-full">
                <LogOut />
                Sair
              </button>
            }
          />
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
