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
import { getObrasList } from "@/lib/queries";

export const dynamic = "force-dynamic";

const riscoVariant = { baixo: "success", medio: "secondary", alto: "warning" } as const;

function risco(intensidade: number): keyof typeof riscoVariant {
  if (intensidade > 380) return "alto";
  if (intensidade > 250) return "medio";
  return "baixo";
}

const faseLabel: Record<string, string> = {
  fundacao: "Fundação",
  estrutura: "Estrutura",
  acabamento: "Acabamento",
  entrega: "Entrega",
  concluida: "Concluída",
};

export default async function ObrasPage() {
  const obras = await getObrasList();

  return (
    <AppShell active="/obras">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Cadastro</p>
      <h1 className="mt-1 mb-6 font-display text-3xl font-extrabold tracking-tight">
        Obras licenciadas
      </h1>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Tipologia</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Intensidade</TableHead>
                <TableHead>Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((row) => (
                <TableRow key={row.obraId}>
                  <TableCell>
                    <div className="font-medium">{row.nome}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {row.alvara} · {row.construtora}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.tipologia}</TableCell>
                  <TableCell className="font-mono">{row.areaM2.toLocaleString("pt-BR")} m²</TableCell>
                  <TableCell className="text-muted-foreground">{faseLabel[row.fase] ?? row.fase}</TableCell>
                  <TableCell className="font-mono">{row.intensidade} kg/m²</TableCell>
                  <TableCell>
                    <Badge variant={riscoVariant[risco(row.intensidade)]}>{risco(row.intensidade)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
