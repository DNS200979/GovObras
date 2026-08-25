"use client";

import { useMemo, useState } from "react";
import { Flame, Leaf, Search } from "lucide-react";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent } from "@carbonfree/ui/shadcn/card";
import { Input } from "@carbonfree/ui/shadcn/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@carbonfree/ui/shadcn/tabs";
import type { RequisitoAuditoria } from "@/lib/queries";
import { NovoRequisitoSheet } from "./novo-requisito-sheet";

function Lista({ itens, natureza }: { itens: RequisitoAuditoria[]; natureza: "passivo" | "ativo" }) {
  if (itens.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum requisito encontrado.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {itens.map((r) => (
        <div key={r.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={natureza === "passivo" ? "warning" : "success"} className="font-mono">
                {r.codigo}
              </Badge>
              <span className="font-mono text-[11px] text-muted-foreground">{r.unidade}</span>
            </div>
            <p className="text-sm font-medium break-words">{r.requisito}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Evidência primária
              </p>
              <p className="mt-1 text-sm break-words text-muted-foreground">{r.evidenciaPrimaria}</p>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Teste de verificação
              </p>
              <p className="mt-1 text-sm break-words text-muted-foreground">{r.testeVerificacao}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RequisitosClient({ requisitos }: { requisitos: RequisitoAuditoria[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return requisitos;
    return requisitos.filter((r) =>
      [r.codigo, r.requisito, r.unidade, r.evidenciaPrimaria, r.testeVerificacao]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [requisitos, busca]);

  const passivo = filtrados.filter((r) => r.natureza === "passivo");
  const ativo = filtrados.filter((r) => r.natureza === "ativo");

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar requisito, evidência, código…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
          <NovoRequisitoSheet />
        </div>
        <Tabs defaultValue="passivo">
          <TabsList>
            <TabsTrigger value="passivo" className="gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[var(--color-ambar)]" />
              Passivo — o que a obra emite ({passivo.length})
            </TabsTrigger>
            <TabsTrigger value="ativo" className="gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-primary" />
              Ativo — o que reduz ou remove ({ativo.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="passivo">
            <Lista itens={passivo} natureza="passivo" />
          </TabsContent>
          <TabsContent value="ativo">
            <Lista itens={ativo} natureza="ativo" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
