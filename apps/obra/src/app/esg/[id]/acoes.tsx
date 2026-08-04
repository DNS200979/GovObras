"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { enviarParaAnalise, excluirRascunho, removerDocumento } from "../actions";

export function EnviarParaAnaliseButton({ projetoId, disabled }: { projetoId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        if (!confirm("Enviar este projeto para análise da prefeitura? Não será mais possível editá-lo."))
          return;
        startTransition(() => enviarParaAnalise(projetoId));
      }}
      className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-50"
    >
      {pending ? "Enviando…" : "Enviar para análise"}
    </button>
  );
}

export function ExcluirRascunhoButton({ projetoId }: { projetoId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Excluir este rascunho e todos os documentos anexados? Essa ação não pode ser desfeita."))
          return;
        startTransition(async () => {
          await excluirRascunho(projetoId);
          router.push("/esg");
        });
      }}
      className="rounded-sm border border-linha px-4 py-2 font-display text-[13px] font-semibold text-texto-fraco transition-colors hover:border-ambar hover:text-ambar disabled:opacity-50"
    >
      {pending ? "Excluindo…" : "Excluir rascunho"}
    </button>
  );
}

export function RemoverDocumentoButton({
  documentoId,
  projetoId,
  storagePath,
}: {
  documentoId: string;
  projetoId: string;
  storagePath: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removerDocumento(documentoId, projetoId, storagePath))}
      className="font-mono text-[10px] uppercase tracking-wide text-texto-fraco hover:text-ambar disabled:opacity-50"
    >
      {pending ? "…" : "remover"}
    </button>
  );
}
