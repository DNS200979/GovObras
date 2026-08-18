import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listConcreteirasMunicipio } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ConcreteirasGovPage() {
  const concreteiras = await listConcreteirasMunicipio();

  return (
    <AppShell active="/concreteiras">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Cadeia de suprimento
      </p>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight">
        Concreteiras
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Empresas que fornecem concreto pras obras do município — vinculadas pelas próprias
        construtoras. Rastreabilidade de mistura e ESG são visíveis aqui só depois que a
        concreteira publica.
      </p>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Obras atendidas</TableHead>
                <TableHead>Entregas declaradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concreteiras.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell className="font-medium">
                    <Link href={`/concreteiras/${c.id}`} className="hover:underline">
                      {c.razaoSocial}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{c.cnpj}</TableCell>
                  <TableCell className="font-mono">{c.totalObras}</TableCell>
                  <TableCell className="font-mono">{c.totalEntregas}</TableCell>
                </TableRow>
              ))}
              {concreteiras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhuma concreteira vinculada a obras do município ainda.
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
