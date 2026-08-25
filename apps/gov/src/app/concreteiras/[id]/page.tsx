import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbonfree/ui/shadcn/table";
import { getConcreteiraGov } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "secondary" | "success" | "destructive"> = {
  declarada: "secondary",
  validada: "success",
  contestada: "destructive",
};

const statusLabel: Record<string, string> = {
  declarada: "Declarada",
  validada: "Validada",
  contestada: "Contestada",
};

const categoriaLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

export default async function ConcreteiraGovPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concreteira = await getConcreteiraGov(id);
  if (!concreteira) notFound();

  return (
    <AppShell active="/concreteiras">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Concreteira · CNPJ {concreteira.cnpj}
      </p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight">
        {concreteira.razaoSocial}
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Entregas declaradas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obra</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Composição</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concreteira.entregas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.obraNome}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {new Date(e.dataEntrega).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono">{e.volumeM3.toLocaleString("pt-BR")} m³</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.composicao.length === 0
                          ? "—"
                          : e.composicao
                              .map((c) => `${c.insumo} (${c.quantidade.toLocaleString("pt-BR")} ${c.unidade})`)
                              .join(", ")}
                        {e.materializadoEm ? (
                          <Badge variant="outline" className="ml-2">
                            lançada no inventário
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[e.status] ?? "secondary"}>
                          {statusLabel[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {concreteira.entregas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhuma entrega declarada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>ESG publicado</CardTitle>
            </CardHeader>
            <CardContent>
              {concreteira.esgPublicados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum item ESG publicado por essa concreteira ainda.
                </p>
              ) : (
                <div className="grid gap-4">
                  {concreteira.esgPublicados.map((p) => (
                    <div key={p.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.titulo}</span>
                        <Badge variant="outline">{categoriaLabel[p.categoria] ?? p.categoria}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
