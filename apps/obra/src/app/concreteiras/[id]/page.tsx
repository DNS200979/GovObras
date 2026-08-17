import { notFound } from "next/navigation";
import { Badge } from "@carbonfree/ui/badge";
import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { getConcreteiraNaObra } from "@/lib/queries";

export const dynamic = "force-dynamic";

const statusLabelVinculo: Record<string, string> = {
  convidado: "Convidado",
  ativo: "Ativo",
  encerrado: "Encerrado",
};

const statusEntregaTone: Record<string, "ativo" | "passivo" | "neutro" | "default"> = {
  declarada: "neutro",
  validada: "ativo",
  contestada: "passivo",
};

const statusEntregaLabel: Record<string, string> = {
  declarada: "Declarada",
  validada: "Validada",
  contestada: "Contestada",
};

const categoriaLabel: Record<string, string> = {
  ambiental: "Ambiental",
  social: "Social",
  governanca: "Governança",
};

export default async function ConcreteiraNaObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concreteira = await getConcreteiraNaObra(id);
  if (!concreteira) notFound();

  return (
    <ObraShell active="/concreteiras">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <CardEyebrow>
            {concreteira.obraNome} · CNPJ {concreteira.cnpj}
          </CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
            {concreteira.razaoSocial}
          </h1>
        </div>
        <Badge tone={concreteira.status === "ativo" ? "ativo" : "default"} className="shrink-0">
          {statusLabelVinculo[concreteira.status] ?? concreteira.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardTitle>Entregas declaradas</CardTitle>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              O que a concreteira somou ao cimento em cada carga entregue nesta obra — declarado
              por ela mesma no portal dela.
            </p>
            {concreteira.entregas.length === 0 ? (
              <p className="py-4 text-[13px] text-texto-fraco">Nenhuma entrega declarada ainda.</p>
            ) : (
              <ul className="divide-y divide-linha/60">
                {concreteira.entregas.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-[13.5px] font-semibold text-texto">
                        {e.volumeM3.toLocaleString("pt-BR")} m³
                        {e.traco ? ` · traço ${e.traco}` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] text-texto-fraco">
                          {new Date(e.dataEntrega).toLocaleDateString("pt-BR")}
                        </span>
                        <Badge tone={statusEntregaTone[e.status] ?? "default"}>
                          {statusEntregaLabel[e.status] ?? e.status}
                        </Badge>
                      </div>
                    </div>
                    {e.composicao.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {e.composicao.map((c, i) => (
                          <li
                            key={i}
                            className="rounded-sm bg-concreto px-2 py-0.5 font-mono text-[10.5px] text-texto-fraco"
                          >
                            {c.insumo}: {c.quantidade.toLocaleString("pt-BR")} {c.unidade}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>ESG da concreteira</CardTitle>
            <p className="mb-4 text-[12.5px] leading-relaxed text-texto-fraco">
              Itens publicados pela concreteira — certificações, políticas ambientais e sociais.
            </p>
            {concreteira.esgPublicados.length === 0 ? (
              <p className="text-[13px] text-texto-fraco">Nenhum item ESG publicado ainda.</p>
            ) : (
              <ul className="grid gap-3">
                {concreteira.esgPublicados.map((p) => (
                  <li key={p.id} className="border-t border-linha/60 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[13px] font-bold text-texto">
                        {p.titulo}
                      </span>
                      <Badge>{categoriaLabel[p.categoria] ?? p.categoria}</Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-texto-fraco">
                      {p.descricao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </ObraShell>
  );
}
