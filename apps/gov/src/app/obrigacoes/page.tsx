import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Button } from "@carbonfree/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbonfree/ui/shadcn/table";
import { getCompetenciaSisobra, listEnviosSisobra } from "@/lib/queries";
import { prazoDaCompetencia, rotuloCompetencia } from "@/lib/sisobrapref";
import { RegistrarProtocolo } from "./registrar-protocolo";

export const dynamic = "force-dynamic";

const fmtData = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

export default async function ObrigacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string }>;
}) {
  const { competencia: param } = await searchParams;
  const dados = await getCompetenciaSisobra(
    param ? new Date(param + "T00:00:00Z") : undefined,
  );
  const envios = await listEnviosSisobra();

  const competencia = new Date(dados.competencia + "T00:00:00Z");
  const prazo = prazoDaCompetencia(competencia);
  const diasRestantes = dados.diasRestantes;
  const rotulo = rotuloCompetencia(competencia);

  const semMovimento = dados.prontos === 0;
  const transmitido = dados.envio?.status === "transmitido";
  const urlXml = `/api/sisobrapref?competencia=${dados.competencia}`;

  return (
    <AppShell active="/obrigacoes">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Obrigações acessórias · Receita Federal
      </p>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight">SisobraPref</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        O município é obrigado a informar à Receita Federal, até o dia 10 de cada mês, os alvarás
        de construção emitidos no mês anterior — ou uma declaração de sem movimento, se não houve
        nenhum. O atraso sujeita o município a multa e restrições fiscais.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Competência {rotulo}</CardTitle>
            <CardDescription>
              {dados.alvaras.length} alvará{dados.alvaras.length === 1 ? "" : "s"} emitido
              {dados.alvaras.length === 1 ? "" : "s"} · {dados.prontos} pronto
              {dados.prontos === 1 ? "" : "s"} para envio
              {dados.comPendencia > 0 ? ` · ${dados.comPendencia} com pendência` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dados.alvaras.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                Nenhum alvará com data de emissão nesta competência. O envio será uma declaração
                de sem movimento.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alvará</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.alvaras.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-[12px]">{a.numeroAlvara}</TableCell>
                      <TableCell>{a.nomeObra}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {fmtData(a.dataAlvara)}
                      </TableCell>
                      <TableCell>
                        {a.pendencias.length === 0 ? (
                          <Badge variant="success">pronto</Badge>
                        ) : (
                          <div>
                            <Badge variant="warning">falta preencher</Badge>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {a.pendencias.join(", ")}
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prazo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {prazo.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </p>
              <p
                className={`mt-1 font-mono text-[11px] ${
                  transmitido
                    ? "text-primary"
                    : diasRestantes < 0
                      ? "text-destructive"
                      : diasRestantes <= 3
                        ? "text-[var(--color-ambar)]"
                        : "text-muted-foreground"
                }`}
              >
                {transmitido
                  ? "competência transmitida"
                  : diasRestantes < 0
                    ? `${Math.abs(diasRestantes)} dia(s) em atraso`
                    : `faltam ${diasRestantes} dia(s)`}
              </p>

              {dados.envio?.protocolo ? (
                <p className="mt-4 border-t border-border pt-3 text-[12px] text-muted-foreground">
                  Protocolo{" "}
                  <span className="font-mono text-foreground">{dados.envio.protocolo}</span> em{" "}
                  {fmtData(dados.envio.transmitidoEm)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Arquivo do envio</CardTitle>
              <CardDescription>
                {semMovimento
                  ? "Sem alvarás prontos: o arquivo sai como declaração de sem movimento."
                  : `Lote com ${dados.prontos} alvará${dados.prontos === 1 ? "" : "s"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!dados.cnpjMunicipio && semMovimento ? (
                <p className="rounded-sm border border-[var(--color-ambar)]/40 bg-[var(--color-ambar-claro)] px-3 py-2 text-[12px] text-[var(--color-ambar)]">
                  O município está sem CNPJ cadastrado — ele identifica o emissor no XML.
                </p>
              ) : (
                <Button render={<a href={urlXml} download />}>Baixar XML</Button>
              )}

              <RegistrarProtocolo
                competencia={dados.competencia}
                tipo={semMovimento ? "sem_movimento" : "lote"}
                totalAlvaras={dados.prontos}
                rotulo={rotulo}
              />

              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                O XML sai sem assinatura. Assine com o certificado e-CNPJ do município e transmita
                pelo Web Service da Receita (o município precisa ser optante do DTE). Depois,
                registre aqui o protocolo devolvido.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Histórico de competências</CardTitle>
        </CardHeader>
        <CardContent>
          {envios.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nenhuma competência registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alvarás</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Transmitido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        href={`/obrigacoes?competencia=${e.competencia}`}
                        className="hover:underline"
                      >
                        {rotuloCompetencia(new Date(e.competencia + "T00:00:00Z"))}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {e.tipo === "sem_movimento" ? "Sem movimento" : "Lote"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{e.total_alvaras}</TableCell>
                    <TableCell className="font-mono text-[12px]">{e.protocolo ?? "—"}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {fmtData(e.transmitido_em)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
