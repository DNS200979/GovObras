import { MapPin } from "lucide-react";
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
import { getConstrutoras, getObrasList } from "@/lib/queries";
import { NovaObraSheet } from "./nova-obra-sheet";
import { ObraRowActions } from "./obra-row-actions";

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
  const [obras, construtoras] = await Promise.all([getObrasList(), getConstrutoras()]);

  return (
    <AppShell active="/obras">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Cadastro
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Obras licenciadas
          </h1>
        </div>
        <NovaObraSheet construtoras={construtoras} />
      </div>

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
                <TableHead>Local</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((row) => (
                <TableRow key={row.obraId}>
                  <TableCell>
                    <Link href={`/obras/${row.obraId}`} className="font-medium hover:underline">
                      {row.nome}
                    </Link>
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
                  <TableCell>
                    {row.latitude != null && row.longitude != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        mapa
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ObraRowActions
                      obraId={row.obraId}
                      obraNome={row.nome}
                      construtoras={construtoras}
                      defaultValues={{
                        alvaraNumero: row.alvara,
                        nome: row.nome,
                        tipologia: row.tipologia,
                        areaM2: row.areaM2,
                        fase: row.fase,
                        cno: row.cno,
                        inscricaoImobiliaria: row.inscricaoImobiliaria,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        construtoraId: row.construtoraId,
                        dataAlvara: row.dataAlvara,
                        dataInicioObra: row.dataInicioObra,
                        dataFinalObra: row.dataFinalObra,
                        tipoAlvara: row.tipoAlvara,
                        responsavelExecObra: row.responsavelExecObra,
                        cep: row.cep,
                        tipoLogradouro: row.tipoLogradouro,
                        logradouro: row.logradouro,
                        numeroImovel: row.numeroImovel,
                        complemento: row.complemento,
                        bairro: row.bairro,
                        areaCategoria: row.areaCategoria,
                        areaDestinacao: row.areaDestinacao,
                        areaTipoObra: row.areaTipoObra,
                        respTecnicoTipo: row.respTecnicoTipo,
                        respTecnicoNome: row.respTecnicoNome,
                        respTecnicoRegistro: row.respTecnicoRegistro,
                        respTecnicoDocumento: row.respTecnicoDocumento,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {obras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Nenhuma obra cadastrada ainda.
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
