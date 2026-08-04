import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoriaEsgLabel, listProjetosEsg, statusEsgLabel } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  enviado: "secondary",
  em_analise: "warning",
  aprovado: "success",
  rejeitado: "destructive",
};

export default async function EsgGovPage() {
  const projetos = await listProjetosEsg();
  const pendentes = projetos.filter((p) => p.status === "enviado" || p.status === "em_analise").length;

  return (
    <AppShell active="/esg">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Documentação ESG · desconto fiscal
      </p>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight">
        Projetos ESG
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Projetos ambientais, sociais e de governança enviados pelas construtoras para instruir o
        processo de desconto fiscal. {pendentes} aguardando decisão.
      </p>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Construtora</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Requisito</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetos.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell className="font-medium">
                    <Link href={`/esg/${p.id}`} className="hover:underline">
                      {p.titulo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.obra}</TableCell>
                  <TableCell className="text-muted-foreground">{p.construtora}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoriaEsgLabel[p.categoria] ?? p.categoria}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {p.requisitoCodigo ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {p.enviadoEm ? new Date(p.enviadoEm).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] ?? "outline"}>
                      {statusEsgLabel[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {projetos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum projeto ESG enviado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
