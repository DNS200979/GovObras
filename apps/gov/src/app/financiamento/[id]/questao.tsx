"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Questao, Resposta } from "@/lib/financiamento";
import { responderQuestao } from "../actions";

const OPCOES: { valor: Resposta; label: string }[] = [
  { valor: "sim", label: "Sim" },
  { valor: "parcial", label: "Parcial" },
  { valor: "nao", label: "Não" },
];

export function LinhaQuestao({
  projetoId,
  questao,
  resposta,
  evidencia,
  origem,
}: {
  projetoId: string;
  questao: Questao;
  resposta: Resposta | null;
  evidencia: string | null;
  origem: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const automatica = origem === "automatico";

  return (
    <div className="grid gap-2 border-b border-border py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {questao.dimensao}
          </Badge>
          <span className="font-mono text-[10.5px] text-muted-foreground">peso {questao.peso}</span>
          {automatica ? (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              preenchida pela plataforma
            </Badge>
          ) : null}
        </div>

        <p className="mt-1.5 text-sm">{questao.pergunta}</p>

        {evidencia ? (
          <p className="mt-1.5 rounded-sm border border-border bg-muted/40 px-2.5 py-1.5 text-[12px] text-muted-foreground">
            {evidencia}
          </p>
        ) : null}

        {resposta && resposta !== "sim" ? (
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wide">próxima ação:</span>{" "}
            {questao.proximaAcao}
          </p>
        ) : null}
      </div>

      <div className="flex h-fit shrink-0 gap-1">
        {OPCOES.map((o) => (
          <Button
            key={o.valor}
            size="sm"
            variant={resposta === o.valor ? "default" : "outline"}
            disabled={pending}
            onClick={() =>
              startTransition(() => responderQuestao(projetoId, questao.id, o.valor))
            }
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
