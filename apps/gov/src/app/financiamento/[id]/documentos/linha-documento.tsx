"use client";

import { useActionState, useRef, useTransition } from "react";
import { Download, Paperclip, Trash2 } from "lucide-react";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Button } from "@carbonfree/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@carbonfree/ui/shadcn/select";
import {
  SITUACOES_DOC,
  exigenciaNaRota,
  type DocumentoMatriz,
  type Rota,
  type SituacaoDoc,
} from "@/lib/financiamento";
import {
  anexarDocumento,
  baixarAnexo,
  definirSituacaoDocumento,
  removerAnexo,
  type AnexoState,
} from "../../actions";

const CORES: Record<SituacaoDoc, string> = {
  pendente: "text-muted-foreground",
  em_elaboracao: "text-ambar",
  pronto: "text-verde",
  nao_aplicavel: "text-muted-foreground line-through",
};

export function LinhaDocumento({
  projetoId,
  doc,
  rota,
  situacao,
  nomeArquivo,
  storagePath,
}: {
  projetoId: string;
  doc: DocumentoMatriz;
  rota: Rota;
  situacao: SituacaoDoc;
  nomeArquivo: string | null;
  storagePath: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, enviando] = useActionState<AnexoState, FormData>(
    anexarDocumento,
    {},
  );

  const exigencia = exigenciaNaRota(doc, rota);
  const critico = doc.prioridade === "Crítico" || doc.prioridade.startsWith("Obrigatório");

  return (
    <div className="grid gap-3 border-b border-border py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={critico ? "default" : "outline"} className="font-mono">
            {doc.prioridade}
          </Badge>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {doc.responsavel}
          </span>
          {exigencia.nota !== "Sim" ? (
            <span className="font-mono text-[10.5px] text-ambar">{exigencia.nota}</span>
          ) : null}
        </div>

        <p className={`mt-1.5 text-sm font-medium ${CORES[situacao]}`}>{doc.documento}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{doc.observacao}</p>

        {nomeArquivo && storagePath ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate font-mono text-[11px]">{nomeArquivo}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const url = await baixarAnexo(storagePath);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                })
              }
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-destructive"
              disabled={pending}
              onClick={() => startTransition(() => removerAnexo(projetoId, doc.id))}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : null}

        {state.error ? (
          <p className="mt-1.5 text-[11.5px] text-destructive">{state.error}</p>
        ) : null}
      </div>

      <div className="flex h-fit shrink-0 items-center gap-2">
        <Select
          value={situacao}
          // sem `items` o base-ui não sabe traduzir o valor e o gatilho mostra
          // o valor cru ("em_elaboracao") quando a situação vem do servidor
          items={SITUACOES_DOC}
          onValueChange={(v) =>
            startTransition(() =>
              definirSituacaoDocumento(projetoId, doc.id, v as SituacaoDoc),
            )
          }
          disabled={pending}
        >
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITUACOES_DOC.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form action={formAction}>
          <input type="hidden" name="projetoId" value={projetoId} />
          <input type="hidden" name="documentoId" value={doc.id} />
          <input
            ref={inputRef}
            type="file"
            name="arquivo"
            className="hidden"
            // envia assim que o arquivo é escolhido: o botão visível é o rótulo,
            // um segundo clique em "enviar" só adicionaria um passo
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={enviando}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip />
            {enviando ? "Enviando…" : nomeArquivo ? "Trocar" : "Anexar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
