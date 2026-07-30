"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RequisitoAuditoria } from "@/lib/queries";

function Lista({ itens }: { itens: RequisitoAuditoria[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Código</TableHead>
          <TableHead className="w-64">Requisito</TableHead>
          <TableHead className="w-28">Unidade</TableHead>
          <TableHead className="w-72">Evidência primária</TableHead>
          <TableHead>Teste de verificação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Badge variant="outline" className="font-mono">
                {r.codigo}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{r.requisito}</TableCell>
            <TableCell className="font-mono text-muted-foreground">{r.unidade}</TableCell>
            <TableCell className="text-muted-foreground">{r.evidenciaPrimaria}</TableCell>
            <TableCell className="text-muted-foreground">{r.testeVerificacao}</TableCell>
          </TableRow>
        ))}
        {itens.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              Nenhum requisito encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
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
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar requisito, evidência, código…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <Tabs defaultValue="passivo">
          <TabsList>
            <TabsTrigger value="passivo">Passivo — o que a obra emite ({passivo.length})</TabsTrigger>
            <TabsTrigger value="ativo">Ativo — o que reduz ou remove ({ativo.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="passivo">
            <Lista itens={passivo} />
          </TabsContent>
          <TabsContent value="ativo">
            <Lista itens={ativo} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
