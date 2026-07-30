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
import { getConstrutorasComContagem } from "@/lib/queries";
import { NovaConstrutoraSheet } from "./nova-construtora-sheet";

export const dynamic = "force-dynamic";

const tipoLabel: Record<string, string> = {
  pj: "Empresa (PJ)",
  profissional_independente: "Profissional independente",
};

export default async function ConstrutorasPage() {
  const construtoras = await getConstrutorasComContagem();

  return (
    <AppShell active="/construtoras">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Cadastro
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Construtoras
          </h1>
        </div>
        <NovaConstrutoraSheet />
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obras licenciadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {construtoras.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.razaoSocial}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{c.cnpjCpf}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tipoLabel[c.tipo] ?? c.tipo}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{c.totalObras}</TableCell>
                </TableRow>
              ))}
              {construtoras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhuma construtora cadastrada ainda.
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
