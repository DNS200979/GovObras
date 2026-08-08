import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProjetosCaptacao } from "@/lib/queries";
import { SITUACOES, TEMAS, faixaDaProntidao } from "@/lib/financiamento";
import { NovoProjetoSheet } from "./novo-projeto-sheet";

export const dynamic = "force-dynamic";

const rotulo = (lista: { value: string; label: string }[], v: string) =>
  lista.find((i) => i.value === v)?.label ?? v;

export default async function FinanciamentoPage() {
  const projetos = await listProjetosCaptacao();

  return (
    <AppShell active="/financiamento">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Captação de recursos climáticos
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Financiamento climático
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Cada iniciativa que a prefeitura quer financiar responde a um diagnóstico de prontidão
            de 20 questões. A pontuação define a rota de captação e os canais compatíveis — de
            assistência técnica de preparação a crédito multilateral.
          </p>
        </div>
        <NovoProjetoSheet />
      </div>

      <Card>
        <CardContent>
          {projetos.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum projeto de captação ainda. Cadastre a iniciativa e o diagnóstico já entra
              parcialmente respondido com os dados da plataforma.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Prontidão</TableHead>
                  <TableHead>Rota sugerida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetos.map((p) => {
                  const faixa = faixaDaProntidao(p.prontidaoPct);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/financiamento/${p.id}`} className="font-medium hover:underline">
                          {p.nome}
                        </Link>
                        <div className="font-mono text-[10.5px] text-muted-foreground">
                          {p.respondidas} de 20 questões respondidas
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rotulo(TEMAS, p.tema)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rotulo(SITUACOES, p.situacao)}</Badge>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={p.prontidaoPct} className="h-1.5 flex-1" />
                          <span className="w-9 text-right font-mono text-xs tabular-nums">
                            {p.prontidaoPct}%
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                          {p.classificacao}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs text-[12.5px] text-muted-foreground">
                        {faixa.prioridade}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
